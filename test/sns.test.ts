/* eslint-disable @typescript-eslint/camelcase */
import * as logger from '../lib'
import { sink, once } from './helper'
import { event, nonS3Event, context } from './data/sns'

it('When logging in an S3 SNS context', async () => {
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
        id: '916959af-5266-559e-befa-0c1576863e9a',
        source:
          'arn:aws:sns:eu-west-1:account-id:verified-features-s3-bucket-topic',
      },
      s3: {
        bucket: 'verified-features-raw-us-west-1-account-id',
        key: 'raw/example.csv',
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

it('When logging in a non S3 SNS context', async () => {
  const stream = sink()

  const log = logger.fromContext(nonS3Event, context, { stream })
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
        id: '95df01b4-ee98-5cb9-9903-4c221d41eb5e',
        source: 'arn:aws:sns:us-east-2:123456789012:sns-lambda',
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
    .fromContext(nonS3Event, context, { stream })
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
