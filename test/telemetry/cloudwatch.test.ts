/* eslint-disable @typescript-eslint/camelcase */
import { event, context } from '../data/cloudwatch'
import { TestableTelemetry } from './testTelemetry'
import { Telemetry } from '../../lib/telemetry'

it('When logging in a cloudwatch event context', async () => {
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
  const root = Telemetry.fromContext(event, context, {
    exporter,
  }).appendContext({ vrm, usefulField })

  const child = root.makeChild('Hello world')
  child.end()
  const otherChild = root.makeChild('Warn message')
  otherChild.end()
  root.end()

  // ASSERT
  expect(spans.length).toBe(3)

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

  const root = Telemetry.fromContext(event, context, {
    exporter,
    service,
  })
  root.end()

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

  const root = Telemetry.fromContext(event, context, {
    exporter,
    service,
  })
  root.end()

  expect(spans[0].attributes).toMatchObject({
    context: {
      function: {
        service,
      },
    },
  })
})
