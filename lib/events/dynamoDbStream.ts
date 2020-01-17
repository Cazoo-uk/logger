import { Context, DynamoDBStreamEvent } from 'aws-lambda'
import { makeContext } from '../shared/context'
import { LoggerOptions } from '../index'

export function isDynamoDbStream(event: DynamoDBStreamEvent) {
  if (!event.Records) return false
  return event.Records[0].eventSource === 'aws:dynamodb'
}

export function makeDynamoDbContext(
  event: DynamoDBStreamEvent,
  context: Context,
  options: LoggerOptions
) {
  const record = event.Records[0]
  const ctx = makeContext(context, options, {
    event: {
      id: record.eventID,
      source: record.eventSourceARN,
      type: record.eventName,
    },
  })
  return ctx
}
