const { test } = require("tap");
const logger = require("../lib");
const { sink, once } = require("./helper");

const context = {
  invokedFunctionArn:
    "arn:aws:lambda:region:account-id:function:function-name:alias-name",
  functionName: "my-function",
  functionVersion: "v1.0.1",
  awsRequestId: "request-id",
  logGroupName: "log-group",
  logStreamName: "log-stream"
};

const event = {
  Records: [
    {
      EventSource: "aws:sns",
      EventVersion: "1.0",
      EventSubscriptionArn:
        "arn:aws:sns:eu-west-1:account-id:verified-features-s3-bucket-topic:8c00703d-2514-4bc1-8178-8423e25f57ed",
      Sns: {
        Type: "Notification",
        MessageId: "916959af-5266-559e-befa-0c1576863e9a",
        TopicArn:
          "arn:aws:sns:eu-west-1:account-id:verified-features-s3-bucket-topic",
        Subject: "Amazon S3 Notification",
        Message:
          '{"Records":[{"eventVersion":"2.1","eventSource":"aws:s3","awsRegion":"eu-west-1","eventTime":"2019-07-30T10:57:34.570Z","eventName":"ObjectCreated:Put","userIdentity":{"principalId":"AWS:random-user"},"requestParameters":{"sourceIPAddress":"217.127.172.127"},"responseElements":{"x-amz-request-id":"request-id","x-amz-id-2":"request-id/oUz/request-id+request-id="},"s3":{"s3SchemaVersion":"1.0","bucket":{"name":"verified-features-raw-us-west-1-account-id","ownerIdentity":{"principalId":"ABC123456"},"arn":"arn:aws:s3:::verified-features-raw-eu-west-1-account-id"},"object":{"key":"raw/example.csv","size":422,"eTag":"1253b751ea4ed31c1764c92b4fdaacd3","sequencer":"005D40229E7A01ED12"}}}]}',
        Timestamp: "2019-07-30T10:57:36.166Z",
        SignatureVersion: "1",
        Signature:
          "LznNcdnNG2b2yT2Iu8OkPY5FYbBzkqfJCl3LJt8zrcweUknDjd6mpwdMXEIb5eAVI72q2buBQByEAyFmDaPN3l5vG/vcbt4oujzmYmVziH6eBG1vlVAzagP366Zd7IEML5et/RyRhJS7iUV/H4jbEm88RuH7xZ49FlS1UMFMEpw8LAxgdGWSOcQFaXDUbeG7K2RNmG2e9zUicpHjfDM5ylUpykCWa4k43QewH3LYt4rTjXW5OTEvYljs5yFaX3Wln94jLG3A6lELITnt3ayJ+DnbJYe2Br36+IEN8yCaKTojmACrMSwG0B0V2nWOY+ZkpR6tcwQj0fBch26H0PiSqA==",
        SigningCertUrl: "LOLOLOLOLOLLOOLOOLOLLOLLOLLOLOL",
        UnsubscribeUrl:
          "https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-1:050965784921:verified-features-s3-bucket-topic:8c00703d-2514-4bc1-8178-8423e25f57ed",
        MessageAttributes: {}
      }
    }
  ]
};

const nonS3Event = {
  Records: [
    {
      EventVersion: "1.0",
      EventSubscriptionArn:
        "arn:aws:sns:us-east-2:123456789012:sns-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
      EventSource: "aws:sns",
      Sns: {
        SignatureVersion: "1",
        Timestamp: "2019-01-02T12:45:07.000Z",
        Signature:
          "tcc6faL2yUC6dgZdmrwh1Y4cGa/ebXEkAi6RibDsvpi+tE/1+82j...65r==",
        SigningCertUrl:
          "https://sns.us-east-2.amazonaws.com/SimpleNotificationService-ac565b8b1a6c5d002d285f9598aa1d9b.pem",
        MessageId: "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
        Message: "Hello from SNS!",
        MessageAttributes: {
          Test: {
            Type: "String",
            Value: "TestString"
          },
          TestBinary: {
            Type: "Binary",
            Value: "TestBinary"
          }
        },
        Type: "Notification",
        UnsubscribeUrl:
          "https://sns.us-east-2.amazonaws.com/?Action=Unsubscribe&amp;SubscriptionArn=arn:aws:sns:us-east-2:123456789012:test-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
        TopicArn: "arn:aws:sns:us-east-2:123456789012:sns-lambda",
        Subject: "TestInvoke"
      }
    }
  ]
};

test("When logging in an S3 SNS context", async ({ same }) => {
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
        id: "916959af-5266-559e-befa-0c1576863e9a",
        source:
          "arn:aws:sns:eu-west-1:account-id:verified-features-s3-bucket-topic"
      },
      s3: {
        bucket: "verified-features-raw-us-west-1-account-id",
        key: "raw/example.csv"
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

test("When logging in a non S3 SNS context", async ({ same }) => {
  const stream = sink();

  const log = logger.fromContext(nonS3Event, context, { stream });
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
        id: "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
        source: "arn:aws:sns:us-east-2:123456789012:sns-lambda"
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
    .fromContext(nonS3Event, context, { stream })
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
