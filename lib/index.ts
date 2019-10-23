import uuid from 'uuid/v4'
import { Context, APIGatewayProxyEvent, ScheduledEvent, SQSRecord, SNSEvent, CloudFrontRequestEvent, DynamoDBStreamEvent } from 'aws-lambda' // eslint-disable-line no-unused-vars
import Pino = require('pino') // eslint-disable-line no-unused-vars

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
  withData(data: object): Logger
  withContext(data: object): Logger
}

function withData (this: Pino.Logger, data: object) {
  return makeLogger({ data }, this)
}

function withContext (this: Pino.Logger, data: object) {  
  const bindings: any = (this as any).bindings()
  const context = bindings.context

  const mergedContext = {
    ...context,
    ...data
  }
  return makeLogger({ context: mergedContext}, this)
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
    }
  }
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
  const level = (options && options.level) || process.env.CAZOO_LOGGER_LEVEL || 'info'
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

function makeLogger (data: object, parent?: Pino.Logger, options?: LoggerOptions): Logger {
  let instance: Pino.Logger

  if (parent === undefined) {
    instance = parentLogger(data, options)
  } else {
    instance = parent.child(data)
  }
  Object.assign(instance, {
    withData,
    withContext,
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
      service: (options && options.service) || process.env.CAZOO_LOGGER_SERVICE || ctx.logStreamName
    },
    ...extra
  }
}

function has (obj, ...props) {
  for (const p of props) {
    if (!obj.hasOwnProperty(p)) { return false }
  }
  return true
}

export function forDomainEvent (event: ScheduledEvent, context:Context, options?: LoggerOptions) : Logger | null {
  if (!has(event, 'detail', 'detail-type', 'source', 'id')) {
    return null
  }
  const ctx = makeContext(context, options, {
    event: {
      source: event.source,
      type: event['detail-type'],
      id: event.id
    }
  })
  return makeLogger({ context: ctx }, undefined, options)
}

export function forAPIGatewayEvent (event: APIGatewayProxyEvent, context: Context, options?: LoggerOptions) : Logger | null {
  if (!has(event, 'requestContext')) {
    return null
  }
  const ctx = makeContext(context, options, {
    http: {
      path: event.path,
      connectionId: event.requestContext.connectionId,
      method: event.httpMethod,
      stage: event.requestContext.stage,
      routeKey: event.requestContext.routeKey,
      query: event.multiValueQueryStringParameters
    }
  })
  return makeLogger({ context: ctx }, undefined, options)
}

export function forSQSRecord (record: SQSRecord, context:Context, options?: LoggerOptions) : Logger | null {
  if (!has(record, 'eventSourceARN', 'messageId')) { return null }
  const ctx = makeContext(context, options, {
    sqs: {
      source: record.eventSourceARN,
      id: record.messageId
    }
  })
  return makeLogger({ context: ctx }, undefined, options)
}

export function forCloudFrontRequest (request: CloudFrontRequestEvent, context: Context, options?: LoggerOptions): Logger | null {
  if (!Array.isArray(request.Records) || request.Records[0].cf === undefined) {
    return null
  }
  const cf = request.Records[0].cf
  const ctx = makeContext(context, options, {
    cf: {
      path: cf.request.uri,
      method: cf.request.method,
      dist: cf.config.distributionId,
      type: cf.config.eventType,
      id: cf.config.requestId
    }
  })
  return makeLogger({ context: ctx }, undefined, options)
}

export function forSNS (event: SNSEvent, context:Context, options?: LoggerOptions) : Logger | null {
  const record = event.Records[0]
  if (record.EventSource !== 'aws:sns') { return null }

  const ctx = makeContext(context, options, {
    event: {
      id: record.Sns.MessageId,
      source: record.Sns.TopicArn
    }
  })
  if (record.Sns.Subject === 'Amazon S3 Notification') {
    const msg = JSON.parse(record.Sns.Message)
    const s3 = msg.Records[0].s3
    ctx.s3 = {
      bucket: s3.bucket.name,
      key: s3.object.key
    }
  }
  return makeLogger({ context: ctx }, undefined, options)
}

export function forDynamoDBStream (event: DynamoDBStreamEvent, context: Context, options?: LoggerOptions): Logger | null {
  const record = event.Records[0]
  if (record.eventSource !== 'aws:dynamodb') {
    return null
  }

  const ctx = makeContext(context, options, {
    event: {
      id: record.eventID,
      source: record.eventSourceARN,
      type: record.eventName
    }
  })

  return makeLogger({ context: ctx }, undefined, options)
}

export function empty (options?: LoggerOptions) {
  return makeLogger({}, undefined, options)
}

export function fromContext (event, context, options) {
  try {
    return forDomainEvent(event, context, options) ||
        forAPIGatewayEvent(event, context, options) ||
        forSNS(event, context, options) ||
          forSQSRecord(event, context, options) ||
          forCloudFrontRequest(event, context, options) ||
          forDynamoDBStream(event, context, options) ||
          empty()
  } catch (e) {
    const log = empty()
    log.recordError(e)
    return e
  }
}

export interface ErrorRecorder {
  recordError(e: any, msg?: string): void
  recordErrorAsWarning(e: any, msg?: string): void
}

export type Logger = Pino.Logger & Contexts & ErrorRecorder
