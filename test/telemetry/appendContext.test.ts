import { TestableTelemetry } from './helpers/testableTelemetry'

import { Telemetry, Trace } from '../../lib/telemetry'
import uuid = require('uuid')
import { spanWithName } from './helpers/spanFinders'
import { ReadableSpan } from '@opentelemetry/tracing'

describe('[.appendContext]', () => {
  let spans: ReadableSpan[]
  let root: Trace

  beforeEach(() => {
    const { options, spans: readable } = new TestableTelemetry()
    spans = readable
    root = Telemetry.new(options)
  })

  describe('when the context is set up from the start', () => {
    const originalContext = { original: 'its a vehicle' }
    const additionalContext = { additionalContext: 'its a car' }

    beforeEach(() => {
      root.appendContext(originalContext).appendContext(additionalContext)

      root.end()
    })

    it('should include the additional context', () => {
      expect(spans[0].attributes.context).toMatchObject({
        ...originalContext,
        ...additionalContext,
      })
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
      const span = spanWithName(spans, 'should have old context')
      expect(span.attributes).toMatchObject({ context: oldcontext })
    })

    it('should have both the old and the new context on the child trace', () => {
      const span = spanWithName(spans, 'should have new and old context')
      expect(span.attributes).toMatchObject({
        context: { ...oldcontext, ...newContext },
      })
    })
  })
})
