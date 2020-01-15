import * as logger from '../lib'
import { sink, once } from './helper'
import { requestEvent, context } from './data/cloudfront'

it('When logging in a cloudwatch event context', async () => {
  const stream = sink()

  const log = logger.fromContext(requestEvent, context, { stream })
  log.info('Hello world')

  const result = await once(stream, 'data')

  expect(result).toStrictEqual({
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

it('When using withContext to provide additional context information', async () => {
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
  expect(results.length).toBe(2)

  expect(results[0]).toStrictEqual({
    message: 'Hello world',
    context: {
      vrm,
      usefulField,
    },
  })

  expect(results[1]).toStrictEqual({
    message: 'Warn message',
    context: {
      vrm,
      usefulField,
    },
  })
})
