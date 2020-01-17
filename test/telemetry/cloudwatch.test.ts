/* eslint-disable @typescript-eslint/camelcase */
import { event, context } from '../data/cloudwatch'
import { TestableTelemetry } from './testTelemetry'
import { Telemetry } from '../../lib/telemetry'

it('When logging in a cloudwatch event context', async () => {
  const { spans, exporter } = new TestableTelemetry()
  const tracing = Telemetry.fromContext(event, context, { exporter })
  tracing.for('Hello world', () => {})

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

it('When using withContext to provide additional context information', async () => {
  const vrm = 'ABCDEF'
  const usefulField = 123

  const { spans, exporter } = new TestableTelemetry()
  const tracing = Telemetry.fromContext(event, context, {
    exporter,
  }).appendContext({ vrm, usefulField })

  tracing.for('Hello world', () => {})
  tracing.for('Warn message', () => {})

  // ASSERT
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

it('When specifying a service name', async () => {
  const service = 'my service is the best service'

  const { spans, exporter } = new TestableTelemetry()

  const tracing = Telemetry.fromContext(event, context, {
    exporter,
    service,
  })

  tracing.for('Hello world', () => {})

  expect(spans[0].attributes).toMatchObject({
    context: {
      request_id: context.awsRequestId,
      account_id: 'account-id',
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service,
      },
      event: {
        source: 'aws.events',
        type: 'Scheduled Event',
        id: event.id,
      },
    },
  })
})

it('When specifying the service as an env var', async () => {
  const service = 'my service is the best service'
  process.env.CAZOO_LOGGER_SERVICE = service

  const { spans, exporter } = new TestableTelemetry()

  const tracing = Telemetry.fromContext(event, context, {
    exporter,
    service,
  })

  tracing.for('Hello world', () => {})

  expect(spans[0].attributes).toMatchObject({
    context: {
      function: {
        service,
      },
    },
  })
})
