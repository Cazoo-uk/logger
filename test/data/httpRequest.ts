import { baseContext } from './baseContext'

export const event = {
  account: '123456789012',
  region: 'us-east-2',
  version: 'foo',
  detail: {},
  'detail-type': 'Scheduled Event' as const,
  source: 'aws.events',
  time: '2019-03-01T01:23:45Z',
  id: 'cdc73f9d-aea9-11e3-9d5a-835b769c0d9c',
  resources: ['arn:aws:events:us-east-1:123456789012:rule/my-schedule'],
}

export const context = {
  ...baseContext,
  functionName: 'my-function',
  functionVersion: 'v1.0.1',
  awsRequestId: 'request-id',
  logGroupName: 'log-group',
  logStreamName: 'log-stream',
}
