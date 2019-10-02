const { test } = require('tap')
const logger = require('../lib')
const { sink, once } = require('./helper')

const context = {
  invokedFunctionArn:
    'arn:aws:lambda:region:account-id:function:function-name:alias-name',
  functionName: 'my-function',
  functionVersion: 'v1.0.1',
  awsRequestId: 'request-id',
  logGroupName: 'log-group',
  logStreamName: 'log-stream'
}

const event = {
  Records: [
    {
      awsRegion: 'eu-west-1',
      dynamodb: {},
      eventID: 'given-event-id',
      eventName: 'REMOVE',
      eventSource: 'aws:dynamodb',
      eventSourceARN:
        'arn:aws:dynamodb:eu-west-1:account-id:table/TableName/stream/2020-01-01T00:00:00.000',
      eventVersion: '1.0',
      userIdentity: 'dynamodb.amazonaws.com'
    }
  ]
}

test('When logging in a DynamoDB stream event context', async ({ same }) => {
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
        service: context.logStreamName
      },
      event: {
        id: 'given-event-id',
        source:
          'arn:aws:dynamodb:eu-west-1:account-id:table/TableName/stream/2020-01-01T00:00:00.000',
        type: 'REMOVE'
      }
    },
    msg: 'Hello world'
  })
})
