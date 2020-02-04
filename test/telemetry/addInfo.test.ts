import { ReadableSpan } from '@opentelemetry/tracing'
import uuid = require('uuid')
import { TestableTelemetry } from './helpers/testableTelemetry'
import { Telemetry, Trace } from '../../lib/telemetry'
import { findSpanWithEventMatchingName } from './helpers/spanFinders'

describe('[.addInfo]', () => {
  let spans: ReadableSpan[]
  let root: Trace

  beforeEach(() => {
    const { options, spans: exportedSpans } = new TestableTelemetry()
    spans = exportedSpans
    root = Telemetry.new(options)
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
      let span = findSpanWithEventMatchingName(spans, eventName)
      expect(span).toBeDefined()

      eventName = infoMessages[1]
      span = findSpanWithEventMatchingName(spans, eventName)
      expect(span).toBeDefined()
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

  it('should add info to the correct trace', () => {
    const traceThatShouldHaveInfo = 'trace with info'
    const info = 'some info'

    const child = root.makeChild(traceThatShouldHaveInfo)
    child.addInfo(info)
    root.end()

    const traceThatDoesHaveInfo = findSpanWithEventMatchingName(spans, info)
      .name

    expect(traceThatDoesHaveInfo).toBe(traceThatShouldHaveInfo)
  })
})
