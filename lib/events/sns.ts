import { Context, SNSEvent } from 'aws-lambda'
import { makeContext, LoggerContext } from '../shared/context'
import { LoggerOptions } from '../index'

type S3 = {
  bucket: {
    name: string
  }
  object: {
    key: string
  }
}

function s3For(event: SNSEvent): S3 {
  const msg = JSON.parse(event.Records[0].Sns.Message)
  const s3 = msg.Records[0].s3
  return s3
}

export function isSNS(event: SNSEvent): boolean {
  if (!event.Records) return false
  return event.Records[0].EventSource === 'aws:sns'
}

export function makeSNSContext(
  context: Context,
  options: LoggerOptions,
  event: SNSEvent
): LoggerContext {
  const ctx = makeContext(context, options, {
    event: {
      id: event.Records[0].Sns.MessageId,
      source: event.Records[0].Sns.TopicArn,
    },
  })
  if (event.Records[0].Sns.Subject === 'Amazon S3 Notification') {
    ctx.s3 = {
      bucket: s3For(event).bucket.name,
      key: s3For(event).object.key,
    }
  }
  return ctx
}
