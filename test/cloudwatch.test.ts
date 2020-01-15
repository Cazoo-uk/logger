/* eslint-disable @typescript-eslint/camelcase */
import { test } from 'tap'
import * as logger from '../lib'
import { sink, once } from './helper'
import { event, context } from './data/cloudwatch'

test('When logging in a cloudwatch event context', async ({ same }) => {
  const stream = sink()

  const log = logger.fromContext(event, context, { stream })
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
      event: {
        source: 'aws.events',
        type: 'Scheduled Event',
        id: event.id,
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
    .fromContext(event, context, { stream })
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

test('When specifying a service name', async ({ same }) => {
  const stream = sink()
  const service = 'my service is the best service'

  const log = logger.fromContext(event, context, { stream, service })
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
        service,
      },
      event: {
        source: 'aws.events',
        type: 'Scheduled Event',
        id: event.id,
      },
    },
    msg: 'Hello world',
  })
})

test('When specifying the service as an env var', async ({ match }) => {
  const stream = sink()
  const service = 'my service is the best service'
  process.env.CAZOO_LOGGER_SERVICE = service

  const log = logger.fromContext(event, context, { stream, service })
  log.info('Hello world')

  const result = await once(stream, 'data')

  match(result, {
    context: {
      function: {
        service,
      },
    },
    msg: 'Hello world',
  })
})
