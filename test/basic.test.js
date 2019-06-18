const { test } = require('tap')
const writer = require('flush-write-stream')
const split = require('split2')
const logger = require('../lib')

function sink (func) {
  const result = split((data) => {
    try {
      return JSON.parse(data)
    } catch (err) {
      console.log(err)
      console.log(data)
    }
  })
  if (func) result.pipe(writer.obj(func))
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

test('When logging in a cloudwatch event context', async ({ same }) => {
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

  const stream = sink()

  const log = logger.domainEvent(event, context, sink)
  log.info('Hello world')

  const result = await once(stream, 'data')

  same(result, {
    level: 'info',
    context: {
      request_id: context.awsRequestId,
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName
      }
    },
    message: 'Hello world'
  })
})
