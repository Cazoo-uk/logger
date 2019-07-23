import Pino = require('pino')
import uuid from 'uuid/v4'
import { Context, APIGatewayProxyEvent, ScheduledEvent, SQSRecord } from 'aws-lambda' // eslint-disable-line no-unused-vars

export interface HttpResponseContext {
    status?: number,
    error?: Error,
    body?: any,
    elapsedMs?: number
}

export interface HttpRequestContext { url?: string, method?: string, body?: any }

export interface Contexts {
    withHttpRequest(context: HttpRequestContext): Logger
    withHttpResponse(context: HttpResponseContext): Logger
    withData (data: object): Logger
}

function withData (this: Pino.Logger, data: object) {
  return makeLogger({ data }, this)
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

function makeErrorRecord (error: any, msg?: string) {
  let errorObj: Error

  if (error instanceof Error) {
    errorObj = error
  } else {
    errorObj = {
      message: error.toString(),
      stack: undefined,
      name: typeof (error)
    }
  }

  return {
    msg: msg || errorObj.message,
    error: {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name
    } }
}

function recordError (this: Pino.Logger, e: any, msg?: string) {
  this.error(makeErrorRecord(e, msg))
}

function recordErrorAsWarning (this: Pino.Logger, e: any, msg?: string) {
  this.warn(makeErrorRecord(e, msg))
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

function makeLogger (data: object, parent?: Pino.Logger, options?: LoggerOptions) : Logger {
  let instance: Pino.Logger

  if (parent === undefined) {
    instance = parentLogger(data, options)
  } else {
    instance = parent.child(data)
  }
  Object.assign(instance, {
    withData,
    withHttpRequest,
    withHttpResponse,
    recordErrorAsWarning,
    recordError
  })

  return instance as Logger
}

function parseAccountId (arn: string): string {
  if (!arn) {
    return 'missing'
  }
  const parts = arn.split(':')
  if (parts.length >= 5) {
    return parts[4]
  }
  return `unknown (${arn})`
}

const makeContext = (ctx, options, extra) => {
  return {
    request_id: ctx.awsRequestId,
    account_id: parseAccountId(ctx.invokedFunctionArn),
    function: {
      name: ctx.functionName,
      version: ctx.functionVersion,
      service: (options && options.service) || ctx.logStreamName
    },
    ...extra
  }
}

export function forDomainEvent (event: ScheduledEvent, context:Context, options?: LoggerOptions) : Logger {
  const ctx = makeContext(context, options, {
    event: {
      source: event.source,
      type: event['detail-type'],
      id: event.id
    } })
  return makeLogger({ context: ctx }, undefined, options)
}

export function forAPIGatewayEvent (event: APIGatewayProxyEvent, context: Context, options?: LoggerOptions) : Logger {
  const ctx = makeContext(context, options, {
    http: {
      path: event.path,
      method: event.httpMethod,
      stage: event.requestContext.stage
    } })
  return makeLogger({ context: ctx }, undefined, options)
}

export function forSQSRecord (record: SQSRecord, context:Context, options?: LoggerOptions) : Logger {
  const ctx = makeContext(context, options, {
    sqs: {
      source: record.eventSourceARN,
      id: record.messageId
    } })
  return makeLogger({ context: ctx }, undefined, options)
}

export function empty (options?: LoggerOptions) {
  return makeLogger({}, undefined, options)
}

export interface ErrorRecorder {
    recordError(e: any, msg?: string) : void
    recordErrorAsWarning(e: any, msg?: string) : void
}

export type Logger = Pino.Logger & Contexts & ErrorRecorder
