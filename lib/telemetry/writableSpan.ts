import { ReadableSpan } from '@opentelemetry/tracing'
import { Attributes, Status, TimedEvent, SpanKind } from '@opentelemetry/types'

export class WritableSpan {
  traceId: string
  parentId: string
  name: string
  id: string
  kind: SpanKind
  timestamp: number
  duration: number
  attributes: Attributes
  status: Status
  events: TimedEvent[]

  private constructor(span: ReadableSpan) {
    this.traceId = span.spanContext.traceId
    this.parentId = span.parentSpanId
    this.name = span.name
    this.id = span.spanContext.spanId
    this.kind = span.kind
    this.timestamp = this.hrTimeToMilliseconds(span.startTime)
    this.duration = this.hrTimeToMilliseconds(span.duration)
    this.attributes = span.attributes
    this.status = span.status
    this.events = span.events
  }

  private hrTimeToMilliseconds(hrTime): number {
    return Math.round(hrTime[0] * 1e3 + hrTime[1] / 1e6)
  }

  public stringify(): string {
    return JSON.stringify(this)
  }

  public static from(span: ReadableSpan): WritableSpan {
    return new WritableSpan(span)
  }
}
