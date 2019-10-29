const { test } = require("tap");
const logger = require("../lib");
const { sink } = require("./helper");

const context = {
  invokedFunctionArn:
    "arn:aws:lambda:region:12345678912:function:function-name:alias-name",
  functionName: "my-function",
  functionVersion: "v1.0.1",
  awsRequestId: "request-id",
  logGroupName: "log-group",
  logStreamName: "log-stream"
};

const event = {
  resource: "/{proxy+}",
  path: "/hello/world",
  httpMethod: "POST",
  headers: {
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate",
    "cache-control": "no-cache",
    "CloudFront-Forwarded-Proto": "https",
    "CloudFront-Is-Desktop-Viewer": "true",
    "CloudFront-Is-Mobile-Viewer": "false",
    "CloudFront-Is-SmartTV-Viewer": "false",
    "CloudFront-Is-Tablet-Viewer": "false",
    "CloudFront-Viewer-Country": "US",
    "Content-Type": "application/json",
    headerName: "headerValue",
    Host: "gy415nuibc.execute-api.us-east-1.amazonaws.com",
    "Postman-Token": "9f583ef0-ed83-4a38-aef3-eb9ce3f7a57f",
    "User-Agent": "PostmanRuntime/2.4.5",
    Via: "1.1 d98420743a69852491bbdea73f7680bd.cloudfront.net (CloudFront)",
    "X-Amz-Cf-Id": "pn-PWIJc6thYnZm5P0NMgOUglL1DYtl0gdeJky8tqsg8iS_sgsKD1A==",
    "X-Forwarded-For": "54.240.196.186, 54.182.214.83",
    "X-Forwarded-Port": "443",
    "X-Forwarded-Proto": "https"
  },
  multiValueHeaders: {
    Accept: ["*/*"],
    "Accept-Encoding": ["gzip, deflate"],
    "cache-control": ["no-cache"],
    "CloudFront-Forwarded-Proto": ["https"],
    "CloudFront-Is-Desktop-Viewer": ["true"],
    "CloudFront-Is-Mobile-Viewer": ["false"],
    "CloudFront-Is-SmartTV-Viewer": ["false"],
    "CloudFront-Is-Tablet-Viewer": ["false"],
    "CloudFront-Viewer-Country": ["US"],
    "": [""],
    "Content-Type": ["application/json"],
    headerName: ["headerValue"],
    Host: ["gy415nuibc.execute-api.us-east-1.amazonaws.com"],
    "Postman-Token": ["9f583ef0-ed83-4a38-aef3-eb9ce3f7a57f"],
    "User-Agent": ["PostmanRuntime/2.4.5"],
    Via: ["1.1 d98420743a69852491bbdea73f7680bd.cloudfront.net (CloudFront)"],
    "X-Amz-Cf-Id": ["pn-PWIJc6thYnZm5P0NMgOUglL1DYtl0gdeJky8tqsg8iS_sgsKD1A=="],
    "X-Forwarded-For": ["54.240.196.186, 54.182.214.83"],
    "X-Forwarded-Port": ["443"],
    "X-Forwarded-Proto": ["https"]
  },
  queryStringParameters: {
    name: "me",
    multivalueName: "me"
  },
  multiValueQueryStringParameters: {
    name: ["me"],
    multivalueName: ["you", "me"]
  },
  pathParameters: {
    proxy: "hello/world"
  },
  stageVariables: {
    stageVariableName: "stageVariableValue"
  },
  requestContext: {
    accountId: "12345678912",
    resourceId: "roq9wj",
    stage: "testStage",
    requestId: "deef4878-7910-11e6-8f14-25afc3e9ae33",
    identity: {
      cognitoIdentityPoolId: null,
      accountId: null,
      cognitoIdentityId: null,
      caller: null,
      apiKey: null,
      sourceIp: "192.168.196.186",
      cognitoAuthenticationType: null,
      cognitoAuthenticationProvider: null,
      userArn: null,
      userAgent: "PostmanRuntime/2.4.5",
      user: null
    },
    resourcePath: "/{proxy+}",
    httpMethod: "POST",
    apiId: "gy415nuibc"
  },
  body: '{\r\n\t"a": 1\r\n}',
  isBase64Encoded: false
};

test("When logging in an API Gateway event context", async ({ same }) => {
  const stream = sink();

  const log = logger.fromContext(event, context, { stream });
  log.info("Hello world");

  const result = stream.read();

  same(result, {
    level: "info",
    v: 1,
    context: {
      request_id: context.awsRequestId,
      account_id: event.requestContext.accountId,
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName
      },
      http: {
        path: event.path,
        method: event.httpMethod,
        stage: event.requestContext.stage,
        query: {
          name: ["me"],
          multivalueName: ["you", "me"]
        }
      }
    },
    msg: "Hello world"
  });
});

test("When using withContext to provide additional context information", async ({
  same
}) => {
  const vrm = "ABCDEF";
  const usefulField = 123;
  const stream = sink();

  // ARRANGE
  const log = logger
    .fromContext(event, context, { stream })
    .withContext({ vrm, usefulField });

  const results = [];
  stream.on("data", args => {
    const {
      msg,
      context: { vrm, usefulField }
    } = args;
    results.push({
      message: msg,
      context: {
        vrm,
        usefulField
      }
    });
  });

  // ACT
  log.info("Hello world");
  log.warn("Warn message");

  // ASSERT
  same(results.length, 2);

  same(
    {
      message: "Hello world",
      context: {
        vrm,
        usefulField
      }
    },
    results[0]
  );

  same(
    {
      message: "Warn message",
      context: {
        vrm,
        usefulField
      }
    },
    results[1]
  );
});

const websocketEvent = {
  multiValueHeaders: {
    Host: ["mv55h24unj.execute-api.eu-west-1.amazonaws.com"],
    "Sec-WebSocket-Extensions": ["permessage-deflate; client_max_window_bits"],
    "Sec-WebSocket-Key": ["e7ooTbmoPh+eoEXzKOcU2Q=="],
    "Sec-WebSocket-Version": ["13"],
    "X-Amzn-Trace-Id": ["Root=1-5da8e529-e9bb2fd0a5832d74bd471428"],
    "X-Forwarded-For": ["86.18.92.102"],
    "X-Forwarded-Port": ["443"],
    "X-Forwarded-Proto": ["https"]
  },
  requestContext: {
    routeKey: "$connect",
    messageId: null,
    eventType: "CONNECT",
    extendedRequestId: "Bui-jHH4joEF3fQ=",
    requestTime: "17/Oct/2019:22:03:21 +0000",
    messageDirection: "IN",
    stage: "dev",
    connectedAt: 1571349801845,
    requestTimeEpoch: 1571349801846,
    identity: {
      cognitoIdentityPoolId: null,
      cognitoIdentityId: null,
      principalOrgId: null,
      cognitoAuthenticationType: null,
      userArn: null,
      userAgent: null,
      accountId: null,
      caller: null,
      sourceIp: "86.18.92.102",
      accessKey: null,
      cognitoAuthenticationProvider: null,
      user: null
    },
    requestId: "Bui-jHH4joEF3fQ=",
    domainName: "mv55h24unj.execute-api.eu-west-1.amazonaws.com",
    connectionId: "Bui-jdesjoECJWg=",
    apiId: "mv55h24unj"
  },
  isBase64Encoded: false
};

test("When logging a websocket request", async ({ same }) => {
  const stream = sink();

  const log = logger.fromContext(websocketEvent, context, { stream });
  log.info("Hello world");

  const result = stream.read();

  same(result, {
    level: "info",
    v: 1,
    context: {
      request_id: context.awsRequestId,
      account_id: event.requestContext.accountId,
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName
      },
      http: {
        stage: websocketEvent.requestContext.stage,
        connectionId: "Bui-jdesjoECJWg=",
        routeKey: "$connect"
      }
    },
    msg: "Hello world"
  });
});

test("When using withContext to provide additional context information", async ({
  same
}) => {
  const vrm = "ABCDEF";
  const usefulField = 123;
  const stream = sink();

  // ARRANGE
  const log = logger
    .fromContext(websocketEvent, context, { stream })
    .withContext({ vrm, usefulField });

  const results = [];
  stream.on("data", args => {
    const {
      msg,
      context: { vrm, usefulField }
    } = args;
    results.push({
      message: msg,
      context: {
        vrm,
        usefulField
      }
    });
  });

  // ACT
  log.info("Hello world");
  log.warn("Warn message");

  // ASSERT
  same(results.length, 2);

  same(
    {
      message: "Hello world",
      context: {
        vrm,
        usefulField
      }
    },
    results[0]
  );

  same(
    {
      message: "Warn message",
      context: {
        vrm,
        usefulField
      }
    },
    results[1]
  );
});
