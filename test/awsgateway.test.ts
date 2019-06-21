const { test } = require('tap')
const logger = require('../lib')
const {sink, once} = require('./helper')

const context = {
  functionName: 'my-function',
  functionVersion: 'v1.0.1',
  awsRequestId: 'request-id',
  logGroupName: 'log-group',
  logStreamName: 'log-stream'
}

const event = {
    "resource": "/{proxy+}",
    "path": "/hello/world",
    "httpMethod": "POST",
    "headers": {
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate",
      "cache-control": "no-cache",
      "CloudFront-Forwarded-Proto": "https",
      "CloudFront-Is-Desktop-Viewer": "true",
      "CloudFront-Is-Mobile-Viewer": "false",
      "CloudFront-Is-SmartTV-Viewer": "false",
      "CloudFront-Is-Tablet-Viewer": "false",
      "CloudFront-Viewer-Country": "US",
      "Content-Type": "application/json",
      "headerName": "headerValue",
      "Host": "gy415nuibc.execute-api.us-east-1.amazonaws.com",
      "Postman-Token": "9f583ef0-ed83-4a38-aef3-eb9ce3f7a57f",
      "User-Agent": "PostmanRuntime/2.4.5",
      "Via": "1.1 d98420743a69852491bbdea73f7680bd.cloudfront.net (CloudFront)",
      "X-Amz-Cf-Id": "pn-PWIJc6thYnZm5P0NMgOUglL1DYtl0gdeJky8tqsg8iS_sgsKD1A==",
      "X-Forwarded-For": "54.240.196.186, 54.182.214.83",
      "X-Forwarded-Port": "443",
      "X-Forwarded-Proto": "https"
    },
    "multiValueHeaders":{
      'Accept':[
        "*/*"
      ],
      'Accept-Encoding':[
        "gzip, deflate"
      ],
      'cache-control':[
        "no-cache"
      ],
      'CloudFront-Forwarded-Proto':[
        "https"
      ],
      'CloudFront-Is-Desktop-Viewer':[
        "true"
      ],
      'CloudFront-Is-Mobile-Viewer':[
        "false"
      ],
      'CloudFront-Is-SmartTV-Viewer':[
        "false"
      ],
      'CloudFront-Is-Tablet-Viewer':[
        "false"
      ],
      'CloudFront-Viewer-Country':[
        "US"
      ],
      '':[
        ""
      ],
      'Content-Type':[
        "application/json"
      ],
      'headerName':[
        "headerValue"
      ],
      'Host':[
        "gy415nuibc.execute-api.us-east-1.amazonaws.com"
      ],
      'Postman-Token':[
        "9f583ef0-ed83-4a38-aef3-eb9ce3f7a57f"
      ],
      'User-Agent':[
        "PostmanRuntime/2.4.5"
      ],
      'Via':[
        "1.1 d98420743a69852491bbdea73f7680bd.cloudfront.net (CloudFront)"
      ],
      'X-Amz-Cf-Id':[
        "pn-PWIJc6thYnZm5P0NMgOUglL1DYtl0gdeJky8tqsg8iS_sgsKD1A=="
      ],
      'X-Forwarded-For':[
        "54.240.196.186, 54.182.214.83"
      ],
      'X-Forwarded-Port':[
        "443"
      ],
      'X-Forwarded-Proto':[
        "https"
      ]
    },
    "queryStringParameters": {
      "name": "me",
      "multivalueName": "me"
    },
    "multiValueQueryStringParameters":{
      "name":[
        "me"
      ],
      "multivalueName":[
        "you",
        "me"
      ]
    },
    "pathParameters": {
      "proxy": "hello/world"
    },
    "stageVariables": {
      "stageVariableName": "stageVariableValue"
    },
    "requestContext": {
      "accountId": "12345678912",
      "resourceId": "roq9wj",
      "stage": "testStage",
      "requestId": "deef4878-7910-11e6-8f14-25afc3e9ae33",
      "identity": {
        "cognitoIdentityPoolId": null,
        "accountId": null,
        "cognitoIdentityId": null,
        "caller": null,
        "apiKey": null,
        "sourceIp": "192.168.196.186",
        "cognitoAuthenticationType": null,
        "cognitoAuthenticationProvider": null,
        "userArn": null,
        "userAgent": "PostmanRuntime/2.4.5",
        "user": null
      },
      "resourcePath": "/{proxy+}",
      "httpMethod": "POST",
      "apiId": "gy415nuibc"
    },
    "body": "{\r\n\t\"a\": 1\r\n}",
    "isBase64Encoded": false
  }

test('When logging in an API Gateway event context', async ({ same }) => {
  const stream = sink()

  const log = logger.forAPIGatewayEvent(event, context, stream)
  log.info('Hello world')

  const result = await once(stream, 'data')

  same(result, {
    level: 'info',
    v: 1,
    context: {
      request_id: context.awsRequestId,
      account_id: event.requestContext.accountId,
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName,
        stage: event.requestContext.stage
      },
      http: {
        path: event.path,
        method: event.httpMethod,
      }
    },
    msg: 'Hello world'
  })
})

