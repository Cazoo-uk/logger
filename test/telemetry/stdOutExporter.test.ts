import { Telemetry } from '../../lib/telemetry'
import { Writable } from 'stream'
import { StdOutExporter } from '../../lib/telemetry/'

class StubWritable extends Writable {
  public written: string[]
  constructor() {
    super()
    this.written = []
  }

  write(chunk, _?, __?): boolean {
    this.written.push(chunk)
    return true
  }
}

it('should write to stdout without blowing up', () => {
  const exporter = new StdOutExporter()
  const tracer = Telemetry.new({ exporter })

  tracer.for('I should be written to stdout', () => {})
})

it('should write to the stream provided', async () => {
  const stream = new StubWritable()

  const exporter = new StdOutExporter(stream)
  const tracer = Telemetry.new({ exporter })

  const traceDescription = 'do a thing'
  const subTrace = 'some sub-task'
  const someData = { some: 'data' }
  const someOtherData = { some: { other: 'data' } }

  tracer.for(traceDescription, () => {
    tracer.addInfo('a thing had the following affect', someData)
    tracer.for(subTrace, () => {
      tracer.addInfo('another thing happened', someOtherData)
    })
  })

  expect(stream.written[1]).toContain(traceDescription)
  expect(stream.written[1]).toContain(JSON.stringify(someData))
  expect(stream.written[0]).toContain(subTrace)
  expect(stream.written[0]).toContain(JSON.stringify(someOtherData))
})
