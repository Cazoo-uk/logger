import { WritableSpan } from '../../lib/telemetry/writableSpan'
import { ReadableSpan } from '@opentelemetry/tracing'
import { SpanKind, CanonicalCode } from '@opentelemetry/types'

describe('when making a writable span from a readable span', () => {
  const readable: ReadableSpan = {
    name: 'span',
    kind: SpanKind.CONSUMER,
    spanContext: {
      traceId: '123',
      spanId: '456',
    },

    startTime: [1581939149, 959272963],
    endTime: [1581939149, 969392041],
    status: {
      code: CanonicalCode.OK,
    },
    attributes: {},
    links: [],
    events: [],
    duration: [0, 10119078],
  }
  const writable = WritableSpan.from(readable)

  it('should set the trace id', () => {
    expect(writable.traceId).toBe(readable.spanContext.traceId)
  })

  it('should set the span id', () => {
    expect(writable.id).toBe(readable.spanContext.spanId)
  })

  it('should set the duration in milliseconds', () => {
    expect(writable.duration).toBe(10)
  })

  it('should set the timestamp in microseconds', () => {
    expect(writable.timestamp).toBe(1581939149959273)
  })
})
