import { Context } from 'aws-lambda'

export const baseContext: Context = {
  invokedFunctionArn: '',
  functionName: '',
  functionVersion: '',
  awsRequestId: '',
  logGroupName: '',
  logStreamName: '',
  callbackWaitsForEmptyEventLoop: true,
  succeed: () => {},
  fail: () => {},
  done: () => {},
  getRemainingTimeInMillis: () => 0,
  memoryLimitInMB: '1',
}
