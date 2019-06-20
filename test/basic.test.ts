const { test } = require('tap')
const split = require('split2')
const logger = require('../lib')

function sink () {
  const result = split((data) => {
    try {
      return JSON.parse(data)
    } catch (err) {
      console.log(err)
      console.log(data)
    }
  })
  return result
}

function once (emitter, name) {
  return new Promise((resolve, reject) => {
    if (name !== 'error') emitter.once('error', reject)
    emitter.once(name, (...args) => {
      emitter.removeListener('error', reject)
      resolve(...args)
    })
  })
}

const event = {
  'account': '123456789012',
  'region': 'us-east-2',
  'detail': {},
  'detail-type': 'Scheduled Event',
  'source': 'aws.events',
  'time': '2019-03-01T01:23:45Z',
  'id': 'cdc73f9d-aea9-11e3-9d5a-835b769c0d9c',
  'resources': [
    'arn:aws:events:us-east-1:123456789012:rule/my-schedule'
  ]
}

const context = {
  functionName: 'my-function',
  functionVersion: 'v1.0.1',
  awsRequestId: 'request-id',
  logGroupName: 'log-group',
  logStreamName: 'log-stream'
}

test('When logging in a cloudwatch event context', async ({ same }) => {
  const stream = sink()

  const log = logger.domainEvent({ event, context, stream })
  log.info('Hello world')

  const result = await once(stream, 'data')

  same(result, {
    level: 'info',
    v: 1,
    context: {
      request_id: context.awsRequestId,
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName
      },
      event: {
        source: 'aws.events',
        type: 'Scheduled Event',
        id: event.id
      }
    },
    msg: 'Hello world'
  })
})

test('When logging with no message', async ({ is }) => {
  const stream = sink()

  const log = logger.domainEvent({ event, context, stream })
  log.info({ type: 'random-thing' })

  const result: any = await once(stream, 'data')

  is(result.type, 'random-thing')
  is(result.msg, undefined)
})

test('When logging with data', async ({ is, same }) => {
  const stream = sink()

  const log = logger.domainEvent({ event, context, stream })
  log.withData({event: {'hello': 'world'}}).debug({type: 'event-published'})

  const result: any = await once(stream, 'data')

  is(result.level, 'debug')
  is(result.type, 'event-published')
  same(result.data, {
    event: {
        hello: 'world'
    }
  })
})
