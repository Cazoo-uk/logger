import { event, context } from '../../data/awsgateway'
import { TestableTelemetry } from '../helpers/testableTelemetry'
import { Telemetry } from '../../../lib/telemetry'
import { ReadableSpan } from '@opentelemetry/tracing'

describe('From an API Gateway event context', () => {
  let spans: ReadableSpan[]

  beforeAll(() => {
    const { options, spans: readable } = new TestableTelemetry()
    spans = readable
    const root = Telemetry.fromContext(event, context, options)

    root.end()
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
