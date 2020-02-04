/* eslint-disable @typescript-eslint/camelcase */
import { record, context } from '../../data/sqs'
import { TestableTelemetry } from '../helpers/testableTelemetry'
import { Telemetry } from '../../../lib/telemetry'

it('When logging in an SQS event context', async () => {
  const { spans, options } = new TestableTelemetry()

  const trace = Telemetry.fromContext(record, context, options)
  trace.end()

  expect(spans[0].attributes.context).toMatchObject({
    request_id: context.awsRequestId,
    account_id: 'account-id',
    function: {
      name: context.functionName,
      version: context.functionVersion,
      service: context.logStreamName,
    },
    sqs: {
      source: record.eventSourceARN,
      id: record.messageId,
    },
  })
})
