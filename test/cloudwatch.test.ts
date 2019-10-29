const { test } = require("tap");
const logger = require("../lib");
const { sink, once } = require("./helper");

const event = {
  account: "123456789012",
  region: "us-east-2",
  detail: {},
  "detail-type": "Scheduled Event",
  source: "aws.events",
  time: "2019-03-01T01:23:45Z",
  id: "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
  resources: ["arn:aws:events:us-east-1:123456789012:rule/my-schedule"]
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

  const log = logger.fromContext(event, context, { stream });
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
      event: {
        source: "aws.events",
        type: "Scheduled Event",
        id: event.id
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

test("When specifying a service name", async ({ same }) => {
  const stream = sink();
  const service = "my service is the best service";

  const log = logger.fromContext(event, context, { stream, service });
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
        service
      },
      event: {
        source: "aws.events",
        type: "Scheduled Event",
        id: event.id
      }
    },
    msg: "Hello world"
  });
});

test("When specifying the service as an env var", async ({ match }) => {
  const stream = sink();
  const service = "my service is the best service";
  process.env.CAZOO_LOGGER_SERVICE = service;

  const log = logger.fromContext(event, context, { stream, service });
  log.info("Hello world");

  const result = await once(stream, "data");

  match(result, {
    context: {
      function: {
        service
      }
    },
    msg: "Hello world"
  });
});
