import { has, LoggerContext } from '../shared/context'
import { Context, SQSRecord } from 'aws-lambda'
import { makeContext } from '../shared/context'
import { LoggerOptions } from '../index'

export function isSQSRecord(record: SQSRecord): boolean {
  return has(record, 'eventSourceARN', 'messageId')
}

export function makeSQSRecordContext(
  context: Context,
  options: LoggerOptions,
  record: SQSRecord
): LoggerContext {
  return makeContext(context, options, {
    sqs: {
      source: record.eventSourceARN,
      id: record.messageId,
    },
  })
}
