import { Telemetry, Trace } from '../../lib/telemetry'
import { TestableTelemetry } from './testTelemetry'
import { ReadableSpan } from '@opentelemetry/tracing'

describe('when forgetting to pass through the child tracing', () => {
  let trace: Trace
  let spans: ReadableSpan[]
  beforeEach(() => {
    const { exporter, spans: readable } = new TestableTelemetry()
    spans = readable
    trace = Telemetry.new({ exporter })
  })

  describe('when adding info', () => {
    it('should not add the info to any trace', () => {
      trace.for('name', () => {
        trace.addInfo('some info')
      })

      expect(spans.length).toBe(1)
      expect(spans[0].events.length).toBe(0)
    })
  })

  describe('when an error is thrown deeply nested', () => {
    const error = new Error('oops!')

    beforeEach(() => {
      try {
        trace.for('root', () => {
          trace.for('not root', () => {
            trace.for('not root', () => {
              trace.for('not root', () => {
                trace.for('not root', () => {
                  trace.for('throws error', () => {
                    throw error
                  })
                })
              })
            })
          })
        })
      } catch {
        /* no op */
      }
    })

    it('should still export the spans', () => {
      expect(spans.length).toBe(6)
    })

    it('should add the error as info', () => {
      const span = spans[0]
      const event = span.events[0]
      expect(span.name).toBe('throws error')
      expect(event.name).toBe('error')
      expect(event.attributes).toStrictEqual(error)
    })
  })
})
