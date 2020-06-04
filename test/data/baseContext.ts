import { Context } from 'aws-lambda'

export const baseContext: Context = {
  invokedFunctionArn: '',
  functionName: '',
  functionVersion: '',
  awsRequestId: '',
  logGroupName: '',
  logStreamName: '',
  callbackWaitsForEmptyEventLoop: true,
  succeed: () => {
    /* no-op */
  },
  fail: () => {
    /* no-op */
  },
  done: () => {
    /* no-op */
  },
  getRemainingTimeInMillis: () => 0,
  memoryLimitInMB: '1',
}
