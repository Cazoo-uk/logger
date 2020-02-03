import { Telemetry } from '../../lib/telemetry'

describe('Telemetry static constructors', () => {
  describe('[.fromContext]', () => {
    it("doesn't blow up if given all undefineds", () => {
      const trace = Telemetry.fromContext()
      expect(trace).toBeDefined()

      trace.for('do a thing', () => {
        expect('this code should be hit').toBeDefined()
      })
    })
  })

  describe('[.new]', () => {
    it("doesn't blow up if given undefined context", () => {
      const trace = Telemetry.new()
      expect(trace).toBeDefined()

      trace.for('do a thing', () => {
        expect('this code should be hit').toBeDefined()
      })
    })
  })
})
