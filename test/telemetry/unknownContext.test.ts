import { context } from '../data/cloudfront'
import { TestableTelemetry } from './testTelemetry'
import { Telemetry } from '../../lib/telemetry'
import { AnyEvent } from '../../lib/events/anyEvent'

it('When logging in a cloudwatch event context', async () => {
  const { spans, exporter } = new TestableTelemetry()
  const root = Telemetry.fromContext({} as AnyEvent, context, {
    exporter,
  })

  root.end()

  expect(spans[0].attributes.context).toStrictEqual({})
})
