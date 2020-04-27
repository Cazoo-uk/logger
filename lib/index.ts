import {
  APIGatewayProxyEvent,
  CloudFrontRequestEvent,
  Context,
  DynamoDBStreamEvent,
  ScheduledEvent,
  SNSEvent,
  SQSRecord,
} from 'aws-lambda'

import Pino from 'pino'
import { parentPinoLogger } from './pino/parentPinoLogger'
import { AnyEvent } from './events/anyEvent'
import { recordError, recordErrorAsWarning } from './shared/errors'
import { combineWithBoundContext } from './pino/combineWithBoundContext'
import { makeHttpResponseContext } from './shared/makeHttpResponseContext'
import { getRequestFromBindings } from './pino/getRequestFromBindings'
import { makeHttpRequestContext } from './shared/makeHttpRequestContext'
import { isDomainEvent, makeDomainEventContext } from './events/domainEvent'
import { makeApiGatewayContext, isApiGatewayEvent } from './events/apiGateway'
import { isSQSRecord, makeSQSRecordContext } from './events/sqsRecord'
import { isCloudFrontRequest, makeCloudFrontContext } from './events/cloudFront'
import { makeSNSContext, isSNS } from './events/sns'
import { isDynamoDbStream, makeDynamoDbContext } from './events/dynamoDbStream'
import { getTimeoutBuffer } from './timeout'

const MINIMUM_VALID_TIMEOUT_MS = 50

export interface HttpResponseContext {
  status?: number
  error?: Error
  body?: any
  elapsedMs?: number
}

export interface HttpRequestContext {
  url?: string
  method?: string
  body?: any
}

export interface Contexts {
  withHttpRequest(context: HttpRequestContext): Logger
  withHttpResponse(context: HttpResponseContext): Logger
  withData(data: object): Logger
  withContext(data: object): Logger
}

function configureLambdaTimeout(logger: Logger, options?: LoggerOptions): void {
  if (!options || !options.timeoutAfterMs) return

  const timeoutMs = options.timeoutAfterMs - getTimeoutBuffer()
  if (timeoutMs > MINIMUM_VALID_TIMEOUT_MS)
    setTimeout(
      () => logger.error({ type: 'lambda.timeout' }, 'Lambda Timeout'),
      timeoutMs
    )
}

function makeLogger(
  data: object,
  parent?: Logger,
  options?: LoggerOptions
): Logger {
  let instance: Pino.Logger
  if (parent === undefined) {
    instance = parentPinoLogger(data, options)
  } else {
    instance = parent.child(data)
  }

  Object.assign(instance, {
    /* eslint-disable @typescript-eslint/no-use-before-define */
    withData,
    withContext,
    withHttpRequest,
    withHttpResponse,
    recordErrorAsWarning,
    recordError,
    /* eslint-enable @typescript-eslint/no-use-before-define */
  })

  const logger = instance as Logger

  configureLambdaTimeout(logger, options)

  return logger
}

function withData(this: Logger, data: object): Logger {
  return makeLogger({ data }, this)
}

function withContext(this: Logger, data: object): Logger {
  const mergedContext = combineWithBoundContext(this, data)
  return makeLogger({ context: mergedContext }, this)
}

function withHttpResponse(
  this: Logger,
  {
    status,
    body,
    elapsedMs,
  }: { status: number; error: Error; body: any; elapsedMs: number }
): Logger {
  const responseContext = makeHttpResponseContext(
    getRequestFromBindings(this),
    status,
    body,
    elapsedMs
  )

  return makeLogger(responseContext, this)
}

function withHttpRequest(
  this: Logger,
  { url, method, body }: { url: string; method: string; body: any }
): Logger {
  const requestContext = makeHttpRequestContext(url, method, body)
  return makeLogger(requestContext, this)
}

export interface LoggerOptions {
  stream?: Pino.DestinationStream
  level?: string
  service?: string
  redact?: string[] | Pino.redactOptions
  timeoutAfterMs?: number
}

function forDomainEvent(
  event: ScheduledEvent,
  context: Context,
  options?: LoggerOptions
): Logger | null {
  if (isDomainEvent(event)) {
    return makeLogger(
      {
        context: makeDomainEventContext(context, options, event),
      },
      undefined,
      options
    )
  }
}

function forAPIGatewayEvent(
  event: APIGatewayProxyEvent,
  context: Context,
  options?: LoggerOptions
): Logger | null {
  if (isApiGatewayEvent(event)) {
    return makeLogger(
      {
        context: makeApiGatewayContext(context, options, event),
      },
      undefined,
      options
    )
  }
}

function forSQSRecord(
  record: SQSRecord,
  context: Context,
  options?: LoggerOptions
): Logger | null {
  if (isSQSRecord(record)) {
    return makeLogger(
      {
        context: makeSQSRecordContext(context, options, record),
      },
      undefined,
      options
    )
  }
}

function forCloudFrontRequest(
  request: CloudFrontRequestEvent,
  context: Context,
  options?: LoggerOptions
): Logger | null {
  if (isCloudFrontRequest(request)) {
    return makeLogger(
      {
        context: makeCloudFrontContext(request, context, options),
      },
      undefined,
      options
    )
  }
}

function forSNS(
  event: SNSEvent,
  context: Context,
  options?: LoggerOptions
): Logger | null {
  if (isSNS(event)) {
    return makeLogger(
      {
        context: makeSNSContext(context, options, event),
      },
      undefined,
      options
    )
  }
}

function forDynamoDBStream(
  event: DynamoDBStreamEvent,
  context: Context,
  options?: LoggerOptions
): Logger | null {
  if (isDynamoDbStream(event)) {
    return makeLogger(
      {
        context: makeDynamoDbContext(event, context, options),
      },
      undefined,
      options
    )
  }
}

export function empty(options?: LoggerOptions): Logger {
  return makeLogger({}, undefined, options)
}

export function fromContext(
  event: AnyEvent,
  context: Context,
  options?: LoggerOptions
): Logger {
  options = options || {}
  options.timeoutAfterMs =
    options.timeoutAfterMs ||
    (context.getRemainingTimeInMillis && context.getRemainingTimeInMillis())

  try {
    return (
      forDomainEvent(event as ScheduledEvent, context, options) ||
      forAPIGatewayEvent(event as APIGatewayProxyEvent, context, options) ||
      forSNS(event as SNSEvent, context, options) ||
      forSQSRecord(event as SQSRecord, context, options) ||
      forCloudFrontRequest(event as CloudFrontRequestEvent, context, options) ||
      forDynamoDBStream(event as DynamoDBStreamEvent, context, options) ||
      empty(options)
    )
  } catch (error) {
    const logger = empty()
    logger.recordError(
      error,
     `The event is \n${ event }\nand the context is \n${ context }`)
    return logger
  }
}

export interface ErrorRecorder {
  recordError(e: any, msg?: string): void
  recordErrorAsWarning(e: any, msg?: string): void
}

export type Logger = Pino.Logger & Contexts & ErrorRecorder
