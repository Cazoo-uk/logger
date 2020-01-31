import { ReadableSpan } from '@opentelemetry/tracing'
import { TimedEvent } from '@opentelemetry/types'
import uuid = require('uuid')
import { TestableTelemetry } from './testTelemetry'
import { Telemetry, TelemetryLogger } from '../../lib/telemetry'

describe('Cazoo Telemetry', () => {
  let spans: ReadableSpan[]
  let tracing: TelemetryLogger

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
    tracing = Telemetry.new({ exporter })
  })

  it('should log a basic telemetry trace', () => {
    tracing.for('name', () => {
      tracing.addInfo('some info')
    })

    expect(spans.length).toBe(1)
    expect(spans[0].events[0].name).toBe('some info')
    expect(spans[0].events[0].attributes).toBeUndefined()
  })

  describe('when adding multiple infos to the same trace', () => {
    const infoMessages = ['some info', 'some more info']
    beforeEach(() => {
      tracing.for('temp', () => {
        tracing.addInfo(infoMessages[0])
        tracing.addInfo(infoMessages[1])
      })
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
      tracing.for(rootSpanName, () => {
        /* hey I'm doing a thing */
        tracing.for(firstChild.name, () => {
          /* hey me too */
          tracing.addInfo(firstChild.message)
        })
        tracing.for(secondChild.name, () => {
          tracing.addInfo(secondChild.message)

          tracing.for(thirdChild.name, () => {
            tracing.addInfo(thirdChild.message)
          })
        })
      })
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
    beforeEach(() => {
      try {
        tracing.for('root', () => {
          throw error
        })
      } catch {
        /* no op */
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
  })

  describe('should log even when an error is thrown deeply nested', () => {
    const error = new Error('oops!')
    beforeEach(() => {
      try {
        tracing.for('root', () => {
          tracing.for('not root', () => {
            tracing.for('not root', () => {
              tracing.for('not root', () => {
                tracing.for('not root', () => {
                  tracing.for('throws error', () => {
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

    it('should export the span', () => {
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

  describe('when adding arbitrary data to a trace', () => {
    let dataAboutThingThatHappened: { dataPoint1: string; dataPoint2: string }

    beforeEach(() => {
      dataAboutThingThatHappened = {
        dataPoint1: uuid(),
        dataPoint2: uuid(),
      }
      tracing.for('root', () => {
        tracing.addInfo('something happened', dataAboutThingThatHappened)
      })
    })

    it('should export the span', () => {
      expect(spans.length).toBe(1)
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

      tracing.appendContext(oldcontext)

      tracing.for('should have old context', () => {
        tracing.appendContext(newContext)
        tracing.for('should have new and old context', () => {
          tracing.addInfo('should be attached to trace with new context')
        })
        tracing.addInfo('should be attached to trace with old context')
      })
    })

    it('should track both traces', () => {
      expect(spans.length).toBe(2)
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

    tracing.for('root', () => {
      tracing.for(traceThatShouldHaveInfo, () => {
        tracing.addInfo(info)
      })
    })

    const traceThatDoesHaveInfo = findSpanWithEventMatchingName(info).name
    expect(traceThatDoesHaveInfo).toBe(traceThatShouldHaveInfo)
  })
})
