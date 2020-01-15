import { baseContext } from './baseContext'
import { DynamoDBStreamEvent } from 'aws-lambda'

export const context = {
  ...baseContext,
  invokedFunctionArn:
    'arn:aws:lambda:region:account-id:function:function-name:alias-name',
  functionName: 'my-function',
  functionVersion: 'v1.0.1',
  awsRequestId: 'request-id',
  logGroupName: 'log-group',
  logStreamName: 'log-stream',
}

export const event: DynamoDBStreamEvent = {
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
      userIdentity: 'dynamodb.amazonaws.com',
    },
  ],
}
