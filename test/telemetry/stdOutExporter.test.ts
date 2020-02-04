import { Writable } from 'stream'
import { StdOutExporter } from '../../lib/telemetry/stdOutExporter'
import { Telemetry } from '../../lib/telemetry'

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
  const root = Telemetry.new({ exporter })

  root.makeChild('I should be written to stdout')
  root.end()
})

it('should write to the stream provided', async () => {
  const stream = new StubWritable()

  const exporter = new StdOutExporter(stream)
  const root = Telemetry.new({ exporter })

  const traceDescription = 'do a thing'
  const subTrace = 'some sub-task'
  const someData = { some: 'data' }
  const someOtherData = { some: { other: 'data' } }

  const child = root.makeChild('do a thing')
  child.addInfo('a thing had the following affect', someData)
  const subChild = child.makeChild(subTrace)
  subChild.addInfo('another thing happened', someOtherData)
  root.end()

  expect(stream.written[0]).toContain(subTrace)
  expect(stream.written[0]).toContain(JSON.stringify(someOtherData))
  expect(stream.written[2]).toContain(traceDescription)
  expect(stream.written[2]).toContain(JSON.stringify(someData))
})

it('should end each line with a newline', async () => {
  const stream = new StubWritable()

  const exporter = new StdOutExporter(stream)
  const root = Telemetry.new({ exporter })

  const child = root.makeChild('child')

  child.addInfo('a thing had the following affect', 'some data')
  const subChild = child.makeChild('subchild')
  subChild.addInfo('another thing happened', 'some other data')
  root.end()

  expect(stream.written[0]).not.toContain('\n')
  expect(stream.written[1]).toBe('\n')
  expect(stream.written[2]).not.toContain('\n')
  expect(stream.written[3]).toBe('\n')
})
