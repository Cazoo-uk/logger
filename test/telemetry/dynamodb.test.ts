/* eslint-disable @typescript-eslint/camelcase */
import { event, context } from '../data/dynamodb'
import { TestableTelemetry } from './testTelemetry'
import { Telemetry } from '../../lib/telemetry'

it('When logging in a DynamoDB stream event context', async () => {
  const { spans, exporter } = new TestableTelemetry()

  const root = Telemetry.fromContext(event, context, { exporter })
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
        id: 'given-event-id',
        source:
          'arn:aws:dynamodb:eu-west-1:account-id:table/TableName/stream/2020-01-01T00:00:00.000',
        type: 'REMOVE',
      },
    },
  })
})

it('When using withContext to provide additional context information', async () => {
  const vrm = 'ABCDEF'
  const usefulField = 123
  const { spans, exporter } = new TestableTelemetry()
  const root = Telemetry.fromContext(event, context, {
    exporter,
  }).appendContext({ vrm, usefulField })

  root.end()

  expect(spans.length).toBe(1)

  expect(spans[0].attributes).toMatchObject({
    context: {
      vrm,
      usefulField,
    },
  })
})
