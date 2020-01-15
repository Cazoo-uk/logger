import * as logger from '../lib'
import { sink } from './helper'
import { event, websocketEvent, context } from './data/awsgateway'

it('When logging in an API Gateway event context', () => {
  const stream = sink()

  const log = logger.fromContext(event, context, { stream })
  log.info('Hello world')

  const result = stream.read()

  expect(result).toEqual({
    level: 'info',
    v: 1,
    context: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      request_id: context.awsRequestId,
      // eslint-disable-next-line @typescript-eslint/camelcase
      account_id: event.requestContext.accountId,
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName,
      },
      http: {
        path: event.path,
        method: event.httpMethod,
        stage: event.requestContext.stage,
        query: {
          name: ['me'],
          multivalueName: ['you', 'me'],
        },
      },
    },
    msg: 'Hello world',
  })
})

it('When using withContext to provide additional context information', () => {
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

  expect(results[0]).toEqual({
    message: 'Hello world',
    context: {
      vrm,
      usefulField,
    },
  })

  expect(results[1]).toEqual({
    message: 'Warn message',
    context: {
      vrm,
      usefulField,
    },
  })
})

it('When logging a websocket request', () => {
  const stream = sink()

  const log = logger.fromContext(websocketEvent, context, { stream })
  log.info('Hello world')

  const result = stream.read()

  expect(result).toMatchObject({
    level: 'info',
    v: 1,
    context: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      request_id: context.awsRequestId,
      // eslint-disable-next-line @typescript-eslint/camelcase
      account_id: event.requestContext.accountId,
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName,
      },
      http: {
        stage: websocketEvent.requestContext.stage,
        connectionId: 'Bui-jdesjoECJWg=',
        routeKey: '$connect',
      },
    },
    msg: 'Hello world',
  })
})

it('When using withContext to provide additional context information', () => {
  const vrm = 'ABCDEF'
  const usefulField = 123
  const stream = sink()

  // ARRANGE
  const log = logger
    .fromContext(websocketEvent, context, { stream })
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

  expect(results[0]).toEqual({
    message: 'Hello world',
    context: {
      vrm,
      usefulField,
    },
  })

  expect(results[1]).toEqual({
    message: 'Warn message',
    context: {
      vrm,
      usefulField,
    },
  })
})
