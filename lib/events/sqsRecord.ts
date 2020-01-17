import { has } from '../shared/context'
import { Context, SQSRecord } from 'aws-lambda'
import { makeContext } from '../shared/context'
import { LoggerOptions } from '../index'

export function makeSQSRecordContext(
  context: Context,
  options: LoggerOptions,
  record: SQSRecord
) {
  return makeContext(context, options, {
    sqs: {
      source: record.eventSourceARN,
      id: record.messageId,
    },
  })
}

export function isSQSRecord(record: SQSRecord) {
  return has(record, 'eventSourceARN', 'messageId')
}
