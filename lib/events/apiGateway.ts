import { APIGatewayProxyEvent, Context } from 'aws-lambda'
import { makeContext } from '../shared/context'
import { LoggerOptions } from '../index'
import { has } from '../shared/context'

export function isApiGatewayEvent(event: APIGatewayProxyEvent) {
  return has(event, 'requestContext')
}

export function makeApiGatewayContext(
  context: Context,
  options: LoggerOptions,
  event: APIGatewayProxyEvent
) {
  return makeContext(context, options, {
    http: {
      path: event.path,
      connectionId: event.requestContext.connectionId,
      method: event.httpMethod,
      stage: event.requestContext.stage,
      routeKey: event.requestContext.routeKey,
      query: event.multiValueQueryStringParameters,
    },
  })
}
