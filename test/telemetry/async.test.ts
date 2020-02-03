import { ReadableSpan } from '@opentelemetry/tracing'
import { TestableTelemetry } from './testTelemetry'
import { Telemetry, Trace } from '../../lib/telemetry'

describe('When awaiting before an add info', () => {
  const eventName = 'something happened'
  const info = { a: 'b' }
  let telemetry: Trace
  let spans: ReadableSpan[]

  async function async(trace: Trace, ms: number): Promise<string> {
    return trace.async('going async', async (trace: Trace) => {
      await new Promise(resolve => setTimeout(resolve, ms))
      trace.addInfo(eventName, info)
      return 'ok'
    })
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

describe('when using `for` instead of `async`', () => {
  const info = { a: 'b' }
  let telemetry: Trace
  let spans: ReadableSpan[]

  async function async(trace: Trace, ms: number): Promise<string> {
    return trace.for('going async', async (trace: Trace) => {
      await new Promise(resolve => setTimeout(resolve, ms))
      trace.addInfo('something happened', info)
      return 'ok'
    })
  }

  beforeAll(() => {
    const { exporter, spans: readable } = new TestableTelemetry()
    telemetry = Telemetry.new({ exporter })
    spans = readable
  })

  it('will not be able to add info to the contextual trace', async () => {
    const result = await async(telemetry, 1)
    expect(result).toBe('ok')
    expect(spans.length).toBe(1)
    expect(spans[0].events.length).toBe(0)
  })
})

describe('Async nested in a non-async', () => {
  let telemetry: Trace
  let spans: ReadableSpan[]

  function forThenAsync(trace: Trace, ms: number): Promise<string> {
    return trace.for('sync', trace => {
      return trace.async('async', async (trace: Trace) => {
        await new Promise(resolve => setTimeout(resolve, ms))
        trace.addInfo('something happened', { a: 'b' })
        return 'ok'
      })
    })
  }

  beforeAll(() => {
    const { exporter, spans: readable } = new TestableTelemetry()
    telemetry = Telemetry.new({ exporter })
    spans = readable
  })

  it('should still be able to add info to the contextual trace', async () => {
    const result = await forThenAsync(telemetry, 1)
    expect(result).toBe('ok')
    expect(spans.length).toBe(2)
    expect(spans[1].events.length).toBe(1)
    expect(spans[0].name).toBe('sync')
    expect(spans[1].name).toBe('async')
    expect(spans[1].parentSpanId).toBe(spans[0].spanContext.spanId)
    expect(spans[0].parentSpanId).toBeUndefined()
  })
})

describe('non-async nested in async', () => {
  let telemetry: Trace
  let spans: ReadableSpan[]

  function asyncThenFor(trace: Trace, ms: number): Promise<string> {
    return trace.async('async', async trace => {
      await new Promise(resolve => setTimeout(resolve, ms))
      return trace.for('sync', async (trace: Trace) => {
        trace.addInfo('something happened', { a: 'b' })
        return 'ok'
      })
    })
  }

  beforeAll(() => {
    const { exporter, spans: readable } = new TestableTelemetry()
    telemetry = Telemetry.new({ exporter })
    spans = readable
  })

  it('should still be able to add info to the contextual trace', async () => {
    const result = await asyncThenFor(telemetry, 1)
    expect(result).toBe('ok')
    expect(spans.length).toBe(2)
    expect(spans[0].events.length).toBe(1)
    expect(spans[0].name).toBe('sync')
    expect(spans[1].name).toBe('async')
    expect(spans[0].parentSpanId).toBe(spans[1].spanContext.spanId)
    expect(spans[1].parentSpanId).toBeUndefined()
  })
})

describe('When throwing', () => {
  let telemetry: Trace
  let spans: ReadableSpan[]
  const error: Error = new Error('oops')
  let thrown: Error

  async function throwsAsync(trace: Trace): Promise<string> {
    return trace.async('going async', async () => {
      throw error
    })
  }

  beforeAll(async () => {
    const { exporter, spans: readable } = new TestableTelemetry()
    telemetry = Telemetry.new({ exporter })
    spans = readable
    try {
      await throwsAsync(telemetry)
    } catch (err) {
      thrown = err
    }
  })

  it('should include the error in the events', async () => {
    expect(spans.length).toBe(1)
    expect(spans[0].events.length).toBe(1)
    expect(thrown).toBe(error)
  })
})
