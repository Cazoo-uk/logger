import { Context, ScheduledEvent } from 'aws-lambda'
import { makeContext, has } from '../shared/context'
import { LoggerOptions } from '../index'

export function makeDomainEventContext(
  context: Context,
  options: LoggerOptions,
  event: ScheduledEvent
) {
  return makeContext(context, options, {
    event: {
      source: event.source,
      type: event['detail-type'],
      id: event.id,
    },
  })
}

export function isDomainEvent(event: ScheduledEvent) {
  return has(event, 'detail', 'detail-type', 'source', 'id')
}
