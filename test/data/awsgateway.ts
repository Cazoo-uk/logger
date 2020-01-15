import { baseContext } from './baseContext'
import {
  Context,
  APIGatewayEventRequestContext,
  APIGatewayProxyEvent,
} from 'aws-lambda'

export const context: Context = {
  ...baseContext,
  invokedFunctionArn:
    'arn:aws:lambda:region:12345678912:function:function-name:alias-name',
  functionName: 'my-function',
  functionVersion: 'v1.0.1',
  awsRequestId: 'request-id',
  logGroupName: 'log-group',
  logStreamName: 'log-stream',
}

const baseIdentity = {
  accessKey: null,
  accountId: null,
  apiKey: null,
  apiKeyId: null,
  caller: null,
  cognitoAuthenticationProvider: null,
  cognitoAuthenticationType: null,
  cognitoIdentityId: null,
  cognitoIdentityPoolId: null,
  sourceIp: '',
  user: null,
  userAgent: null,
  userArn: null,
}

const baseRequestContext: APIGatewayEventRequestContext = {
  accountId: '',
  apiId: '',
  httpMethod: '',
  identity: baseIdentity,
  path: '',
  stage: '',
  requestId: '',
  requestTimeEpoch: 0,
  resourceId: '',
  resourcePath: '',
}

const baseEvent: APIGatewayProxyEvent = {
  resource: '/{proxy+}',
  path: '/hello/world',
  httpMethod: 'POST',
  headers: {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate',
    'cache-control': 'no-cache',
    'CloudFront-Forwarded-Proto': 'https',
    'CloudFront-Is-Desktop-Viewer': 'true',
    'CloudFront-Is-Mobile-Viewer': 'false',
    'CloudFront-Is-SmartTV-Viewer': 'false',
    'CloudFront-Is-Tablet-Viewer': 'false',
    'CloudFront-Viewer-Country': 'US',
    'Content-Type': 'application/json',
    headerName: 'headerValue',
    Host: 'gy415nuibc.execute-api.us-east-1.amazonaws.com',
    'Postman-Token': '9f583ef0-ed83-4a38-aef3-eb9ce3f7a57f',
    'User-Agent': 'PostmanRuntime/2.4.5',
    Via: '1.1 d98420743a69852491bbdea73f7680bd.cloudfront.net (CloudFront)',
    'X-Amz-Cf-Id': 'pn-PWIJc6thYnZm5P0NMgOUglL1DYtl0gdeJky8tqsg8iS_sgsKD1A==',
    'X-Forwarded-For': '54.240.196.186, 54.182.214.83',
    'X-Forwarded-Port': '443',
    'X-Forwarded-Proto': 'https',
  },
  multiValueHeaders: {
    Accept: ['*/*'],
    'Accept-Encoding': ['gzip, deflate'],
    'cache-control': ['no-cache'],
    'CloudFront-Forwarded-Proto': ['https'],
    'CloudFront-Is-Desktop-Viewer': ['true'],
    'CloudFront-Is-Mobile-Viewer': ['false'],
    'CloudFront-Is-SmartTV-Viewer': ['false'],
    'CloudFront-Is-Tablet-Viewer': ['false'],
    'CloudFront-Viewer-Country': ['US'],
    '': [''],
    'Content-Type': ['application/json'],
    headerName: ['headerValue'],
    Host: ['gy415nuibc.execute-api.us-east-1.amazonaws.com'],
    'Postman-Token': ['9f583ef0-ed83-4a38-aef3-eb9ce3f7a57f'],
    'User-Agent': ['PostmanRuntime/2.4.5'],
    Via: ['1.1 d98420743a69852491bbdea73f7680bd.cloudfront.net (CloudFront)'],
    'X-Amz-Cf-Id': ['pn-PWIJc6thYnZm5P0NMgOUglL1DYtl0gdeJky8tqsg8iS_sgsKD1A=='],
    'X-Forwarded-For': ['54.240.196.186, 54.182.214.83'],
    'X-Forwarded-Port': ['443'],
    'X-Forwarded-Proto': ['https'],
  },
  queryStringParameters: {
    name: 'me',
    multivalueName: 'me',
  },
  multiValueQueryStringParameters: {
    name: ['me'],
    multivalueName: ['you', 'me'],
  },
  pathParameters: {
    proxy: 'hello/world',
  },
  stageVariables: {
    stageVariableName: 'stageVariableValue',
  },
  requestContext: {
    ...baseRequestContext,
    accountId: '12345678912',
    apiId: 'gy415nuibc',
    httpMethod: 'POST',
    identity: {
      ...baseIdentity,
      sourceIp: '192.168.196.186',
      userAgent: 'PostmanRuntime/2.4.5',
    },
    stage: 'testStage',
    requestId: 'deef4878-7910-11e6-8f14-25afc3e9ae33',
    resourceId: 'roq9wj',
    resourcePath: '/{proxy+}',
  },
  body: '{\r\n\t"a": 1\r\n}',
  isBase64Encoded: false,
}

export const event: APIGatewayProxyEvent = baseEvent

export const websocketEvent: APIGatewayProxyEvent = {
  ...baseEvent,
  multiValueHeaders: {
    Host: ['mv55h24unj.execute-api.eu-west-1.amazonaws.com'],
    'Sec-WebSocket-Extensions': ['permessage-deflate; client_max_window_bits'],
    'Sec-WebSocket-Key': ['e7ooTbmoPh+eoEXzKOcU2Q=='],
    'Sec-WebSocket-Version': ['13'],
    'X-Amzn-Trace-Id': ['Root=1-5da8e529-e9bb2fd0a5832d74bd471428'],
    'X-Forwarded-For': ['86.18.92.102'],
    'X-Forwarded-Port': ['443'],
    'X-Forwarded-Proto': ['https'],
  },
  requestContext: {
    ...baseRequestContext,
    routeKey: '$connect',
    messageId: null,
    eventType: 'CONNECT',
    extendedRequestId: 'Bui-jHH4joEF3fQ=',
    requestTime: '17/Oct/2019:22:03:21 +0000',
    messageDirection: 'IN',
    stage: 'dev',
    connectedAt: 1571349801845,
    requestTimeEpoch: 1571349801846,
    identity: {
      ...baseIdentity,
      sourceIp: '86.18.92.102',
    },
    requestId: 'Bui-jHH4joEF3fQ=',
    domainName: 'mv55h24unj.execute-api.eu-west-1.amazonaws.com',
    connectionId: 'Bui-jdesjoECJWg=',
    apiId: 'mv55h24unj',
  },
  isBase64Encoded: false,
}