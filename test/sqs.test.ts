const { test } = require("tap");
const logger = require("../lib");
const { sink, once } = require("./helper");

const record = {
  messageId: "059f36b4-87a3-44ab-83d2-661975830a7d",
  receiptHandle: "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
  body: "test",
  attributes: {
    ApproximateReceiveCount: "1",
    SentTimestamp: "1545082649183",
    SenderId: "AIDAIENQZJOLO23YVJ4VO",
    ApproximateFirstReceiveTimestamp: "1545082649185"
  },
  messageAttributes: {},
  md5OfBody: "098f6bcd4621d373cade4e832627b4f6",
  eventSource: "aws:sqs",
  eventSourceARN: "arn:aws:sqs:us-east-2:123456789012:my-queue",
  awsRegion: "us-east-2"
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

test("When logging in an SQS event context", async ({ same }) => {
  const stream = sink();

  const log = logger.forSQSRecord(record, context, { stream });
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
      sqs: {
        source: record.eventSourceARN,
        id: record.messageId
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
    .forSQSRecord(record, context, { stream })
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
