import { LoggerOptions } from '../index'
import {
  Context,
  SNSEvent,
  SQSRecord,
  DynamoDBStreamEvent,
  ScheduledEvent,
} from 'aws-lambda'
import {
  SpanExporter,
  BasicTracer,
  SimpleSpanProcessor,
  ReadableSpan,
} from '@opentelemetry/tracing'
import { makeSNSContext, isSNS } from '../events/sns'
import { AnyEvent } from '../events/anyEvent'
import { makeSQSRecordContext, isSQSRecord } from '../events/sqsRecord'
import { makeDynamoDbContext, isDynamoDbStream } from '../events/dynamoDbStream'
import { isDomainEvent, makeDomainEventContext } from '../events/domainEvent'
import {
  isCloudFrontRequest,
  makeCloudFrontContext,
} from '../events/cloudFront'
import { CloudFrontRequestEvent, APIGatewayProxyEvent } from 'aws-lambda'
import { isApiGatewayEvent, makeApiGatewayContext } from '../events/apiGateway'
import {
  Tracer,
  Attributes,
  Span,
  Status,
  TimedEvent,
} from '@opentelemetry/types'
import { AsyncHooksScopeManager } from '@opentelemetry/scope-async-hooks'
import { Writable } from 'stream'
import { ExportResult } from '@opentelemetry/base'

class WritableSpan {
  traceId: string
  parentId: string
  name: string
  id: string
  kind: string
  timestamp: number
  duration: number
  attributes: Attributes
  status: Status
  events: TimedEvent[]
}

function noop(): void {
  /* no op */
}

function filterBrokenPipe(err, stream): void {
  // TODO verify on Windows
  if (err.code === 'EPIPE') {
    // when copying from sonic boom, they talk about stopping logging.
    // I don't understand the full context. It may be that we can
    // simplify what's happening here. Leaving original comment for
    // posterity
    /* If we get EPIPE, we should stop logging here
     however we have no control to the consumer of
     SonicBoom, so we just overwrite the write method */

    stream.write = noop
    stream.end = noop
    stream.flushSync = noop
    stream.destroy = noop
    return
  }
  stream.removeListener('error', filterBrokenPipe)
  stream.emit('error', err)
}

function protectWritableFromBrokenPipe(stream: Writable): Writable {
  stream.on('error', filterBrokenPipe)
  return stream
}

export class StdOutExporter implements SpanExporter {
  private out: Writable

  public constructor(out?: Writable) {
    this.out = protectWritableFromBrokenPipe(out || process.stdout)
  }

  export(spans: ReadableSpan[], done: (result: ExportResult) => void): void {
    return this.sendSpans(spans, done)
  }

  shutdown(): void {
    return this.sendSpans([])
  }

  private hrTimeToMicroseconds(hrTime): number {
    return Math.round(hrTime[0] * 1e6 + hrTime[1] / 1e3)
  }

  private writable(span): string {
    const writable: WritableSpan = {
      traceId: span.spanContext.traceId,
      parentId: span.parentSpanId,
      name: span.name,
      id: span.spanContext.spanId,
      kind: span.kind,
      timestamp: this.hrTimeToMicroseconds(span.startTime),
      duration: this.hrTimeToMicroseconds(span.duration),
      attributes: span.attributes,
      status: span.status,
      events: span.events,
    }

    return JSON.stringify(writable)
  }

  private sendSpans(
    spans: ReadableSpan[],
    done?: (result: ExportResult) => void
  ): void {
    for (const span of spans) {
      this.out.write(this.writable(span))
    }
    if (done) {
      return done(ExportResult.SUCCESS)
    }
  }
}

class StdOutTelemetryLogger implements TelemetryLogger {
  private spans: Span[]
  private tracer: Tracer
  private context: Attributes

  public constructor(exporter?: SpanExporter) {
    const config = {
      scopeManager: new AsyncHooksScopeManager(),
    }

    const tracer = new BasicTracer(config)
    exporter = exporter || new StdOutExporter()
    tracer.addSpanProcessor(new SimpleSpanProcessor(exporter))
    this.tracer = tracer
    this.spans = []
  }

  appendContext(context: unknown): TelemetryLogger {
    this.context = {
      ...this.context,
      ...(context as Attributes),
    }

    return this
  }

  addInfo(description: string, additionalData?: unknown): void {
    const span = this.tracer.getCurrentSpan()
    this.addEvent(span, description, additionalData)
  }

  for<T extends (...args: unknown[]) => ReturnType<T>>(
    description: string,
    codeToTrace: T
  ): ReturnType<T> {
    const span = this.tracer.startSpan(description, {
      parent: this.tracer.getCurrentSpan(),
      attributes: { context: this.context },
    })
    this.spans.push(span)

    try {
      const result = this.tracer.withSpan(span, codeToTrace)
      span.end()
      return result
    } catch (e) {
      this.addEvent(span, 'error', e)
      span.end()
      throw e
    }
  }

  private addEvent(span: Span, eventName: string, eventData?: unknown): void {
    span.addEvent(eventName, eventData as Attributes)
  }
}

function getContext(
  event: AnyEvent,
  context: Context,
  options: TelemetryOptions
): unknown {
  if (isSNS(event as SNSEvent)) {
    return makeSNSContext(context, options, event as SNSEvent)
  } else if (isSQSRecord(event as SQSRecord)) {
    return makeSQSRecordContext(context, options, event as SQSRecord)
  } else if (isDynamoDbStream(event as DynamoDBStreamEvent)) {
    return makeDynamoDbContext(event as DynamoDBStreamEvent, context, options)
  } else if (isDomainEvent(event as ScheduledEvent)) {
    return makeDomainEventContext(context, options, event as ScheduledEvent)
  } else if (isCloudFrontRequest(event as CloudFrontRequestEvent)) {
    return makeCloudFrontContext(
      event as CloudFrontRequestEvent,
      context,
      options
    )
  } else if (isApiGatewayEvent(event as APIGatewayProxyEvent)) {
    return makeApiGatewayContext(
      context,
      options,
      event as APIGatewayProxyEvent
    )
  }

  // return {}
}

export interface TelemetryOptions extends LoggerOptions {
  exporter?: SpanExporter
}

export class Telemetry {
  public static fromContext(
    event: AnyEvent,
    context: Context,
    options: TelemetryOptions
  ): TelemetryLogger {
    return new StdOutTelemetryLogger(options.exporter).appendContext(
      getContext(event, context, options)
    )
  }

  static new(options: TelemetryOptions): TelemetryLogger {
    return new StdOutTelemetryLogger(options.exporter)
  }
}

export interface TelemetryLogger {
  appendContext(context: unknown): TelemetryLogger

  addInfo(description: string, additionalData?: unknown): void

  for<T extends (...args: unknown[]) => ReturnType<T>>(
    description: string,
    codeToTrace: T
  ): ReturnType<T>
}
