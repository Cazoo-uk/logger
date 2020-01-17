import { requestEvent, context } from '../data/cloudfront'
import { TestableTelemetry } from './testTelemetry'
import { Telemetry } from '../../lib/telemetry'

it('When logging in a cloudwatch event context', async () => {
  const { spans, exporter } = new TestableTelemetry()
  const tracing = Telemetry.fromContext(requestEvent, context, {
    exporter,
  })

  tracing.for('some description', () => {})

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

it('When using withContext to provide additional context information', async () => {
  const vrm = 'ABCDEF'
  const usefulField = 123

  const { spans, exporter } = new TestableTelemetry()

  const tracing = Telemetry.fromContext(requestEvent, context, {
    exporter,
  }).appendContext({ vrm, usefulField })

  tracing.for('Hello world', () => {})
  tracing.for('Hello other world', () => {})

  expect(spans.length).toBe(2)

  expect(spans[0].attributes).toMatchObject({
    context: {
      vrm,
      usefulField,
    },
  })

  expect(spans[1].attributes).toMatchObject({
    context: {
      vrm,
      usefulField,
    },
  })
})
