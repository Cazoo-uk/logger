import { ReadableSpan } from '@opentelemetry/tracing'
import { TestableTelemetry } from './testTelemetry'
import { Telemetry, Trace } from '../../lib/telemetry'

describe('When awaiting before an add info', () => {
  const eventName = 'something happened'
  const info = { a: 'b' }
  let telemetry: Trace
  let spans: ReadableSpan[]

  async function async(trace: Trace, ms: number): Promise<string> {
    const child = trace.makeChild('going async')
    await new Promise(resolve => setTimeout(resolve, ms))
    child.addInfo(eventName, info)
    const result = 'ok'
    child.end()
    return result
  }

  beforeAll(() => {
    const { exporter, spans: readable } = new TestableTelemetry()
    telemetry = Telemetry.new({ exporter })
    spans = readable
  })

  it('should still be able to add info to the contextual trace', async () => {
    const result = await async(telemetry, 1)
    expect(result).toBe('ok')
    expect(spans.length).toBe(1)
    expect(spans[0].events.length).toBe(1)
    expect(spans[0].events[0].name).toBe(eventName)
    expect(spans[0].events[0].attributes).toMatchObject(info)
  })
})

describe('When throwing', () => {
  let root: Trace
  let spans: ReadableSpan[]
  const error: Error = new Error('oops')
  let thrown: Error

  async function throwsAsync(trace: Trace): Promise<string> {
    trace.makeChild('going async')
    throw error
  }

  beforeAll(async () => {
    const { exporter, spans: readable } = new TestableTelemetry()
    root = Telemetry.new({ exporter })
    spans = readable
    try {
      await throwsAsync(root)
    } catch (err) {
      root.error(err)
      thrown = err
    }
  })

  it('should include the error in the events', async () => {
    expect(spans.length).toBe(2)
    expect(spans[1].events.length).toBe(1)
    expect(JSON.stringify(spans[1].events[0])).toContain(JSON.stringify(error))
    expect(thrown).toBe(error)
  })
})
