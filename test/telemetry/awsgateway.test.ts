import { event, context } from '../data/awsgateway'
import { TestableTelemetry } from './testTelemetry'
import { Telemetry } from '../../lib/telemetry'

describe('When tracing in an API Gateway event context', () => {
  const traceName = 'trace name'
  const infoDescription = 'something happened'
  const infoData = { someData: 'some value' }

  const { exporter, spans } = new TestableTelemetry()
  const tracing = Telemetry.fromContext(event, context, {
    exporter,
  })

  tracing.for(traceName, () => {
    tracing.addInfo(infoDescription, infoData)
  })

  it('should add the full context of aws gateway', () => {
    expect(spans[0].attributes).toMatchObject({
      context: {
        // eslint-disable-next-line @typescript-eslint/camelcase
        request_id: context.awsRequestId,
        // eslint-disable-next-line @typescript-eslint/camelcase
        account_id: event.requestContext.accountId,
        function: {
          name: context.functionName,
          version: context.functionVersion,
          service: context.logStreamName,
        },
        http: {
          path: event.path,
          method: event.httpMethod,
          stage: event.requestContext.stage,
          query: {
            name: ['me'],
            multivalueName: ['you', 'me'],
          },
        },
      },
    })
  })
})

describe('When using withContext to provide additional context information for traces', () => {
  const traceName = 'trace name'
  const infoDescription = 'something happened'
  const infoData = { someData: 'some value' }
  const additionalContext = { additionalContext: 'its a car' }

  const { exporter, spans } = new TestableTelemetry()
  const tracing = Telemetry.fromContext(event, context, {
    exporter,
  }).appendContext(additionalContext)

  tracing.for(traceName, () => {
    tracing.addInfo(infoDescription, infoData)
  })

  it('should include the additional context', () => {
    expect(spans[0].attributes).toMatchObject({
      context: {
        // eslint-disable-next-line @typescript-eslint/camelcase
        request_id: context.awsRequestId,
        // eslint-disable-next-line @typescript-eslint/camelcase
        account_id: event.requestContext.accountId,
        function: {
          name: context.functionName,
          version: context.functionVersion,
          service: context.logStreamName,
        },
        http: {
          path: event.path,
          method: event.httpMethod,
          stage: event.requestContext.stage,
          query: {
            name: ['me'],
            multivalueName: ['you', 'me'],
          },
        },
        ...additionalContext,
      },
    })
  })
})
