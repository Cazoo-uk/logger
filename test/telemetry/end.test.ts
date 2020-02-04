import { Telemetry, Trace } from '../../lib/telemetry'

describe('When ending a root when the child has ended', () => {
  let root: Trace

  beforeAll(() => {
    root = Telemetry.new()
    const child = root.makeChild('going async')
    child.end()
  })

  it('should not throw', async () => {
    root.end()
  })
})
