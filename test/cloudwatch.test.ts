/* eslint-disable @typescript-eslint/camelcase */
import * as logger from '../lib'
import { sink, once } from './helper'
import { event, context } from './data/cloudwatch'

it('When logging in a cloudwatch event context', async () => {
  const stream = sink()

  const log = logger.fromContext(event, context, { stream })
  log.info('Hello world')

  const result = await once(stream, 'data')

  expect(result).toStrictEqual({
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

it('When using withContext to provide additional context information', async () => {
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

it('When specifying a service name', async () => {
  const stream = sink()
  const service = 'my service is the best service'

  const log = logger.fromContext(event, context, { stream, service })
  log.info('Hello world')

  const result = await once(stream, 'data')

  expect(result).toStrictEqual({
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

it('When specifying the service as an env var', async () => {
  const stream = sink()
  const service = 'my service is the best service'
  process.env.CAZOO_LOGGER_SERVICE = service

  const log = logger.fromContext(event, context, { stream, service })
  log.info('Hello world')

  const result = await once(stream, 'data')

  expect(result).toMatchObject({
    context: {
      function: {
        service,
      },
    },
    msg: 'Hello world',
  })
})
