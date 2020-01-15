import { test } from 'tap'
import * as logger from '../lib'
import { sink } from './helper'
import { event, websocketEvent, context } from './data/awsgateway'

test('When logging in an API Gateway event context', async ({ same }) => {
  const stream = sink()

  const log = logger.fromContext(event, context, { stream })
  log.info('Hello world')

  const result = stream.read()

  same(result, {
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

  console.log(results[1])
  console.log(vrm)
  console.log(usefulField)
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

test('When logging a websocket request', async ({ match }) => {
  const stream = sink()

  const log = logger.fromContext(websocketEvent, context, { stream })
  log.info('Hello world')

  const result = stream.read()

  match(result, {
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

test('When using withContext to provide additional context information', async ({
  same,
}) => {
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
