import { TestableTelemetry } from './helpers/testableTelemetry'
import { record, context } from '../data/sqs'
import { Telemetry } from '../../lib/telemetry'

describe('when creating a trace from context', () => {
  it('When including a service name in the options', async () => {
    const service = 'my service is the best service'

    const { spans, options } = new TestableTelemetry()

    const root = Telemetry.fromContext(record, context, { ...options, service })
    root.end()

    expect(spans[0].attributes.context).toMatchObject({
      function: {
        service,
      },
    })
  })

  it('When specifying the service as an env var', async () => {
    const service = 'my service is the best service'
    process.env.CAZOO_LOGGER_SERVICE = service

    const { spans, options } = new TestableTelemetry()

    const root = Telemetry.fromContext(record, context, options)
    root.end()

    expect(spans[0].attributes.context).toMatchObject({
      function: {
        service,
      },
    })
  })
})
