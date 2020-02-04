/* eslint-disable @typescript-eslint/camelcase */
import { event, context } from '../../data/cloudwatch'
import { TestableTelemetry } from '../helpers/testableTelemetry'
import { Telemetry } from '../../../lib/telemetry'

it('When logging in a cloudwatch event context', async () => {
  const { spans, options } = new TestableTelemetry()
  const root = Telemetry.fromContext(event, context, options)
  root.end()

  expect(spans[0].attributes).toMatchObject({
    context: {
      request_id: context.awsRequestId,
      account_id: 'account-id',
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName,
      },
      event: {
        source: 'aws.events',
        type: 'Scheduled Event',
        id: event.id,
      },
    },
  })
})
