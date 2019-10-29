import { CloudFrontRequestEvent } from "aws-lambda"; // eslint-disable-line no-unused-vars

const { test } = require("tap");
const logger = require("../lib");
const { sink, once } = require("./helper");

// Taken from AWS Documentation here
// https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-request
const requestEvent: CloudFrontRequestEvent = {
  Records: [
    {
      cf: {
        config: {
          distributionDomainName: "d123.cloudfront.net",
          distributionId: "EDFDVBD6EXAMPLE",
          eventType: "viewer-request",
          requestId: "MRVMF7KydIvxMWfJIglgwHQwZsbG2IhRJ07sn9AkKUFSHS9EXAMPLE=="
        },
        request: {
          clientIp: "2001:0db8:85a3:0:0:8a2e:0370:7334",
          querystring: "size=large",
          uri: "/picture.jpg",
          method: "GET",
          headers: {
            host: [
              {
                key: "Host",
                value: "d111111abcdef8.cloudfront.net"
              }
            ],
            "user-agent": [
              {
                key: "User-Agent",
                value: "curl/7.51.0"
              }
            ]
          },
          origin: {
            s3: {
              authMethod: "origin-access-identity",
              customHeaders: {
                "my-origin-custom-header": [
                  {
                    key: "My-Origin-Custom-Header",
                    value: "Test"
                  }
                ]
              },
              domainName: "my-bucket.s3.amazonaws.com",
              path: "/s3_path",
              region: "us-east-1"
            }
          }
        }
      }
    }
  ]
};

const context = {
  invokedFunctionArn:
    "arn:aws:lambda:region:account-id:function:function-name:alias-name",
  functionName: "my-function",
  functionVersion: "v1.0.1",
  awsRequestId: "request-id",
  logGroupName: "log-group",
  logStreamName: "log-stream"
};

test("When logging in a cloudwatch event context", async ({ same }) => {
  const stream = sink();

  const log = logger.fromContext(requestEvent, context, { stream });
  log.info("Hello world");

  const result = await once(stream, "data");

  same(result, {
    level: "info",
    v: 1,
    context: {
      request_id: context.awsRequestId,
      account_id: "account-id",
      function: {
        name: context.functionName,
        version: context.functionVersion,
        service: context.logStreamName
      },
      cf: {
        path: "/picture.jpg",
        method: "GET",
        dist: "EDFDVBD6EXAMPLE",
        type: "viewer-request",
        id: "MRVMF7KydIvxMWfJIglgwHQwZsbG2IhRJ07sn9AkKUFSHS9EXAMPLE=="
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
    .fromContext(requestEvent, context, { stream })
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
