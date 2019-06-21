import Pino from 'pino'
import uuid from 'uuid/v4'
import { Context, APIGatewayProxyEvent, ScheduledEvent } from 'aws-lambda' // eslint-disable-line no-unused-vars

function withData (this: Pino.Logger, data: object) {
  return this.child({ data })
}

function withHttpResponse (
  this: Pino.Logger,
  { status, error, body, elapsedMs }:
                           { status: number, error: Error, body: any, elapsedMs: number }) {
  const bindings: any = (this as any).bindings()
  const req = bindings && bindings.data && bindings.data.http && bindings.data.http.req

  return makeLogger({
    data: {
      http: {
        req: {
          id: req && req.id
        },
        resp: {
          status,
          body,
          elapsedMs
        }
      }
    }
  }, this)
}

function withHttpRequest (this: Pino.Logger,
  { url, method, body }: { url: string, method: string, body: any }) {
  const requestId = uuid()
  return makeLogger({
    data: {
      http: {
        req: {
          id: requestId,
          url,
          method,
          body
        }
      }
    }
  }, this)
}

export interface LoggerOptions {
    stream?: Pino.DestinationStream,
    level?: string
    service?: string
}

function parentLogger (data: object, options?: LoggerOptions) {
  const level = (options && options.level) || 'info'
  if (options && options.stream) {
    return Pino({
      timestamp: false,
      base: data,
      useLevelLabels: true,
      level
    }, options.stream)
  }

  return Pino({
    timestamp: false,
    base: data,
    useLevelLabels: true,
    level
  })
}

function makeLogger (data: object, parent?: Pino.Logger, options?: LoggerOptions) {
  let instance: Pino.Logger

  if (parent === undefined) {
    instance = parentLogger(data, options)
  } else {
    instance = parent.child(data)
  }
  Object.assign(instance, {
    withData,
    withHttpRequest,
    withHttpResponse
  })

  return instance
}

export function forDomainEvent (event: ScheduledEvent, context:Context, options?: LoggerOptions) {
  return makeLogger({ context: {
    request_id: context.awsRequestId,
    function: {
      name: context.functionName,
      version: context.functionVersion,
      service: options.service || context.logStreamName
    },
    event: {
      source: event.source,
      type: event['detail-type'],
      id: event.id
    }
  }
  }, undefined, options)
}

export function forAPIGatewayEvent (event: APIGatewayProxyEvent, context: Context, options?: LoggerOptions) {
  return makeLogger({ context: {
    request_id: context.awsRequestId,
    account_id: event.requestContext.accountId,
    function: {
      name: context.functionName,
      version: context.functionVersion,
      service: context.logStreamName,
      stage: event.requestContext.stage
    },
    http: {
      path: event.path,
      method: event.httpMethod
    }
  }
  }, undefined, options)
}
