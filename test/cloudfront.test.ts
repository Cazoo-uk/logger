import { test } from 'tap'
import * as logger from '../lib'
import { sink, once } from './helper'
import { requestEvent, context } from './data/cloudfront'

test('When logging in a cloudwatch event context', async ({ same }) => {
  const stream = sink()

  const log = logger.fromContext(requestEvent, context, { stream })
  log.info('Hello world')

  const result = await once(stream, 'data')

  same(result, {
    level: 'info',
    v: 1,
    context: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      request_id: context.awsRequestId,
      // eslint-disable-next-line @typescript-eslint/camelcase
      account_id: 'account-id',
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName,
      },
      cf: {
        path: '/picture.jpg',
        method: 'GET',
        dist: 'EDFDVBD6EXAMPLE',
        type: 'viewer-request',
        id: 'MRVMF7KydIvxMWfJIglgwHQwZsbG2IhRJ07sn9AkKUFSHS9EXAMPLE==',
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
    .fromContext(requestEvent, context, { stream })
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
