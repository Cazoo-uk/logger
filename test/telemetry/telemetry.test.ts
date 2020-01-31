import { Telemetry } from '../../lib/telemetry'

describe('Telemetry static constructors', () => {
  describe('[.fromContext]', () => {
    it("doesn't blow up if given all undefineds", () => {
      const tracer = Telemetry.fromContext()
      expect(tracer).toBeDefined()

      tracer.for('do a thing', () => {
        expect('this code should be hit').toBeDefined()
      })
    })
  })

  describe('[.new]', () => {
    it("doesn't blow up if given undefined context", () => {
      const tracer = Telemetry.new()
      expect(tracer).toBeDefined()

      tracer.for('do a thing', () => {
        expect('this code should be hit').toBeDefined()
      })
    })
  })
})
