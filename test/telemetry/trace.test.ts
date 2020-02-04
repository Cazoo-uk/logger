import { ReadableSpan } from '@opentelemetry/tracing'
import { TestableTelemetry } from './helpers/testableTelemetry'
import { Telemetry, Trace } from '../../lib/telemetry'
import { spanWithName } from './helpers/spanFinders'

describe('Cazoo Telemetry', () => {
  let spans: ReadableSpan[]
  let root: Trace

  beforeEach(() => {
    const { options, spans: exportedSpans } = new TestableTelemetry()
    spans = exportedSpans
    root = Telemetry.new(options)
  })

  it('should log a basic telemetry trace', () => {
    const child = root.makeChild('name')
    child.addInfo('some info')
    child.end()

    expect(spans.length).toBe(1)
    expect(spans[0].events[0].name).toBe('some info')
    expect(spans[0].events[0].attributes).toBeUndefined()
  })

  describe('when creating nested traces', () => {
    const rootSpanName = 'root'
    const firstChild = {
      name: 'first child',
      message: 'some info',
    }
    const secondChild = {
      name: 'second child',
      message: 'some more info',
    }
    const thirdChild = {
      name: 'third child',
      message: 'the final bit of info',
    }

    beforeEach(() => {
      const firstChildTrace = root.makeChild(firstChild.name)
      firstChildTrace.addInfo(firstChild.message)
      const secondChildTrace = root.makeChild(secondChild.name)
      secondChildTrace.addInfo(secondChild.message)

      const thirdChildTrace = secondChildTrace.makeChild(thirdChild.name)
      thirdChildTrace.addInfo(thirdChild.message)
      root.end()
    })

    it('should export 4 spans', () => {
      expect(spans.length).toBe(4)
    })

    it('should log the root trace', () => {
      const rootSpan = spanWithName(spans, rootSpanName)
      expect(rootSpan).toBeDefined()
      expect(rootSpan.parentSpanId).toBeUndefined()
      expect(rootSpan.events.length).toBe(0)
    })

    it('should log the first child trace', () => {
      const rootSpanId = spanWithName(spans, rootSpanName).spanContext.spanId
      const firstChildSpan = spanWithName(spans, firstChild.name)
      expect(firstChildSpan.parentSpanId).toBe(rootSpanId)
      expect(firstChildSpan.events.length).toBe(1)
      expect(firstChildSpan.events[0].name).toBe(firstChild.message)
    })

    it('should log the second child trace', () => {
      const rootSpanId = spanWithName(spans, rootSpanName).spanContext.spanId
      const secondChildSpan = spanWithName(spans, secondChild.name)
      expect(secondChildSpan.parentSpanId).toBe(rootSpanId)
      expect(secondChildSpan.events.length).toBe(1)
      expect(secondChildSpan.events[0].name).toBe(secondChild.message)
    })

    it('should log the third child trace', () => {
      const secondChildSpanId = spanWithName(spans, secondChild.name)
        .spanContext.spanId
      const thirdChildSpan = spanWithName(spans, thirdChild.name)
      expect(thirdChildSpan.parentSpanId).toBe(secondChildSpanId)
      expect(thirdChildSpan.events.length).toBe(1)
      expect(thirdChildSpan.events[0].name).toBe(thirdChild.message)
    })
  })

  describe('when handling errors', () => {
    const error = new Error('oops')
    let thrown: Error

    beforeEach(() => {
      try {
        throw error
      } catch (err) {
        root.error(err)
        thrown = err
      }
    })

    it('should export the span', () => {
      expect(spans.length).toBe(1)
    })

    it('should add the error as an event named "error"', () => {
      const event = spans[0].events[0]
      expect(event.name).toBe('error')
      expect(event.attributes).toStrictEqual(error)
    })

    it('should rethrow', () => {
      expect(thrown).toBe(error)
    })
  })
})
