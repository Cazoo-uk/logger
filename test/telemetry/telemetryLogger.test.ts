import { ReadableSpan } from '@opentelemetry/tracing'
import { TimedEvent } from '@opentelemetry/types'
import uuid = require('uuid')
import { TestableTelemetry } from './testTelemetry'
import { Telemetry, Trace } from '../../lib/telemetry'

describe('Cazoo Telemetry', () => {
  let spans: ReadableSpan[]
  let root: Trace

  function spanWithName(name: string): ReadableSpan {
    return spans.find(y => y.name === name)
  }

  function getEventWithName(name: string, span: ReadableSpan): TimedEvent {
    return span.events.find(y => y.name === name)
  }

  function findSpanWithEventMatchingName(eventName: string): ReadableSpan {
    return spans.find(x => getEventWithName(eventName, x))
  }

  beforeEach(() => {
    const { exporter, spans: exportedSpans } = new TestableTelemetry()
    spans = exportedSpans
    root = Telemetry.new({ exporter })
  })

  it('should log a basic telemetry trace', () => {
    const child = root.makeChild('name')
    child.addInfo('some info')
    child.end()

    expect(spans.length).toBe(1)
    expect(spans[0].events[0].name).toBe('some info')
    expect(spans[0].events[0].attributes).toBeUndefined()
  })

  describe('when adding multiple infos to the same trace', () => {
    const infoMessages = ['some info', 'some more info']
    beforeEach(() => {
      const child = root.makeChild('temp')
      child.addInfo(infoMessages[0])
      child.addInfo(infoMessages[1])
      child.end()
    })

    it('should export 1 span', () => {
      expect(spans.length).toBe(1)
    })

    it('should add all info to events', () => {
      let eventName = infoMessages[0]
      let span = findSpanWithEventMatchingName(eventName)
      expect(span).toBeDefined()

      eventName = infoMessages[1]
      span = findSpanWithEventMatchingName(eventName)
      expect(span).toBeDefined()
    })
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
      const rootSpan = spanWithName(rootSpanName)
      expect(rootSpan).toBeDefined()
      expect(rootSpan.parentSpanId).toBeUndefined()
      expect(rootSpan.events.length).toBe(0)
    })

    it('should log the first child trace', () => {
      const rootSpanId = spanWithName(rootSpanName).spanContext.spanId
      const firstChildSpan = spanWithName(firstChild.name)
      expect(firstChildSpan.parentSpanId).toBe(rootSpanId)
      expect(firstChildSpan.events.length).toBe(1)
      expect(firstChildSpan.events[0].name).toBe(firstChild.message)
    })

    it('should log the second child trace', () => {
      const rootSpanId = spanWithName(rootSpanName).spanContext.spanId
      const secondChildSpan = spanWithName(secondChild.name)
      expect(secondChildSpan.parentSpanId).toBe(rootSpanId)
      expect(secondChildSpan.events.length).toBe(1)
      expect(secondChildSpan.events[0].name).toBe(secondChild.message)
    })

    it('should log the third child trace', () => {
      const secondChildSpanId = spanWithName(secondChild.name).spanContext
        .spanId
      const thirdChildSpan = spanWithName(thirdChild.name)
      expect(thirdChildSpan.parentSpanId).toBe(secondChildSpanId)
      expect(thirdChildSpan.events.length).toBe(1)
      expect(thirdChildSpan.events[0].name).toBe(thirdChild.message)
    })
  })

  describe('should log even when an error is thrown', () => {
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

  describe('when adding arbitrary data to a trace', () => {
    let dataAboutThingThatHappened: { dataPoint1: string; dataPoint2: string }

    beforeEach(() => {
      dataAboutThingThatHappened = {
        dataPoint1: uuid(),
        dataPoint2: uuid(),
      }

      const child = root.makeChild('root')
      child.addInfo('something happened', dataAboutThingThatHappened)
      root.end()
    })

    it('should export the span', () => {
      expect(spans.length).toBe(2)
    })

    it('should include the all the arbitrary data', () => {
      const eventData = spans[0].events[0].attributes
      expect(eventData).toStrictEqual(dataAboutThingThatHappened)
    })
  })

  describe('when the context is changed during tracing', () => {
    let oldcontext: { original: string; context: string }
    let newContext: { new: string; updatedContext: string }

    beforeEach(() => {
      oldcontext = {
        original: uuid(),
        context: uuid(),
      }
      newContext = {
        new: uuid(),
        updatedContext: uuid(),
      }

      root.appendContext(oldcontext)

      const child = root.makeChild('should have old context')
      child.appendContext(newContext)
      const subChild = child.makeChild('should have new and old context')
      subChild.addInfo('should be attached to trace with new context')
      child.addInfo('should be attached to trace with old context')
      root.end()
    })

    it('should track both traces and the root', () => {
      expect(spans.length).toBe(3)
    })

    it('should have the original context on the root trace', () => {
      const span = spanWithName('should have old context')
      expect(span.attributes).toMatchObject({ context: oldcontext })
    })

    it('should have both the old and the new context on the child trace', () => {
      const span = spanWithName('should have new and old context')
      expect(span.attributes).toMatchObject({
        context: { ...oldcontext, ...newContext },
      })
    })
  })

  it('should add info to the correct trace', () => {
    const traceThatShouldHaveInfo = 'trace with info'
    const info = 'some info'

    const child = root.makeChild(traceThatShouldHaveInfo)
    child.addInfo(info)
    root.end()

    const traceThatDoesHaveInfo = findSpanWithEventMatchingName(info).name
    expect(traceThatDoesHaveInfo).toBe(traceThatShouldHaveInfo)
  })
})
