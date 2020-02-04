/* eslint-disable @typescript-eslint/camelcase */
import { record, context } from '../data/sqs'
import { TestableTelemetry } from './testTelemetry'
import { Telemetry } from '../../lib/telemetry'

it('When logging in an SQS event context', async () => {
  const { spans, exporter } = new TestableTelemetry()

  const trace = Telemetry.fromContext(record, context, { exporter })
  trace.end()

  expect(spans[0].attributes).toMatchObject({
    context: {
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
    },
  })
})

it('When using withContext to provide additional context information', () => {
  const vrm = 'ABCDEF'
  const usefulField = 123
  const { spans, exporter } = new TestableTelemetry()

  const trace = Telemetry.fromContext(record, context, {
    exporter,
  }).appendContext({ vrm, usefulField })
  trace.end()

  expect(spans.length).toBe(1)

  expect(spans[0].attributes).toMatchObject({
    context: {
      vrm,
      usefulField,
    },
  })

  expect(spans[0].attributes).toMatchObject({
    context: {
      vrm,
      usefulField,
    },
  })
})
