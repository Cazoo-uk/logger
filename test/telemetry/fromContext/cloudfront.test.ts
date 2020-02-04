import { requestEvent, context } from '../../data/cloudfront'
import { TestableTelemetry } from '../helpers/testableTelemetry'
import { Telemetry } from '../../../lib/telemetry'

it('When logging in a cloudwatch event context', async () => {
  const { spans, options } = new TestableTelemetry()

  const root = Telemetry.fromContext(requestEvent, context, options)

  root.end()

  expect(spans[0].attributes).toMatchObject({
    context: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      request_id: context.awsRequestId,
      // eslint-disable-next-line @typescript-eslint/camelcase
      account_id: 'account-id',
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName,
      },
      cf: {
        path: '/picture.jpg',
        method: 'GET',
        dist: 'EDFDVBD6EXAMPLE',
        type: 'viewer-request',
        id: 'MRVMF7KydIvxMWfJIglgwHQwZsbG2IhRJ07sn9AkKUFSHS9EXAMPLE==',
      },
    },
  })
})
