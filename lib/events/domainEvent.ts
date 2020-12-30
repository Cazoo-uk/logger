import { Context, EventBridgeEvent } from 'aws-lambda'
import { makeContext, has, LoggerContext } from '../shared/context'
import { LoggerOptions } from '../index'

export function isDomainEvent(event: EventBridgeEvent<string, any>): boolean {
  return has(event, 'detail', 'detail-type', 'source', 'id')
}

export function makeDomainEventContext(
  context: Context,
  options: LoggerOptions,
  event: EventBridgeEvent<string, any>
): LoggerContext {
  return makeContext(context, options, {
    event: {
      source: event.source,
      type: event['detail-type'],
      id: event.id,
    },
  })
}
