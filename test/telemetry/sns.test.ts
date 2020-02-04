/* eslint-disable @typescript-eslint/camelcase */
import { event, nonS3Event, context } from '../data/sns'
import { TestableTelemetry } from './testTelemetry'
import { Telemetry } from '../../lib/telemetry'

it('When logging in an S3 SNS context', async () => {
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
        id: '916959af-5266-559e-befa-0c1576863e9a',
        source:
          'arn:aws:sns:eu-west-1:account-id:verified-features-s3-bucket-topic',
      },
      s3: {
        bucket: 'verified-features-raw-us-west-1-account-id',
        key: 'raw/example.csv',
      },
    },
  })
})

it('When using withContext to provide additional context information', () => {
  const vrm = 'ABCDEF'
  const usefulField = 123
  const { spans, exporter } = new TestableTelemetry()

  const root = Telemetry.fromContext(event, context, { exporter })
  root.appendContext({ vrm, usefulField })
  root.end()

  // ASSERT
  expect(spans.length).toBe(1)

  expect(spans[0].attributes).toMatchObject({
    context: {
      vrm,
      usefulField,
    },
  })
})

it('When logging in a non S3 SNS context', async () => {
  const { spans, exporter } = new TestableTelemetry()

  const root = Telemetry.fromContext(nonS3Event, context, {
    exporter,
  })
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
        id: '95df01b4-ee98-5cb9-9903-4c221d41eb5e',
        source: 'arn:aws:sns:us-east-2:123456789012:sns-lambda',
      },
    },
  })
})

it('When using withContext to provide additional context information', async () => {
  const vrm = 'ABCDEF'
  const usefulField = 123
  const { spans, exporter } = new TestableTelemetry()

  const root = Telemetry.fromContext(nonS3Event, context, {
    exporter,
  })
  root.appendContext({ vrm, usefulField })

  root.end()

  // ASSERT
  expect(spans.length).toBe(1)

  expect(spans[0].attributes).toMatchObject({
    context: {
      vrm,
      usefulField,
    },
  })
})
