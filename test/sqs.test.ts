/* eslint-disable @typescript-eslint/camelcase */
import { test } from 'tap'
import * as logger from '../lib'
import { sink, once } from './helper'
import { record, context } from './data/sqs'

test('When logging in an SQS event context', async ({ same }) => {
  const stream = sink()

  const log = logger.forSQSRecord(record, context, { stream })
  log.info('Hello world')

  const result = await once(stream, 'data')

  same(result, {
    level: 'info',
    v: 1,
    context: {
      request_id: context.awsRequestId,
      account_id: 'account-id',
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName,
      },
      sqs: {
        source: record.eventSourceARN,
        id: record.messageId,
      },
    },
    msg: 'Hello world',
  })
})

test('When using withContext to provide additional context information', async ({
  same,
}) => {
  const vrm = 'ABCDEF'
  const usefulField = 123
  const stream = sink()

  // ARRANGE
  const log = logger
    .forSQSRecord(record, context, { stream })
    .withContext({ vrm, usefulField })

  const results = []
  stream.on('data', args => {
    const {
      msg,
      context: { vrm, usefulField },
    } = args
    results.push({
      message: msg,
      context: {
        vrm,
        usefulField,
      },
    })
  })

  // ACT
  log.info('Hello world')
  log.warn('Warn message')

  // ASSERT
  same(results.length, 2)

  same(
    {
      message: 'Hello world',
      context: {
        vrm,
        usefulField,
      },
    },
    results[0]
  )

  same(
    {
      message: 'Warn message',
      context: {
        vrm,
        usefulField,
      },
    },
    results[1]
  )
})
