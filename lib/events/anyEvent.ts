import {
  APIGatewayProxyEvent,
  CloudFrontRequestEvent,
  DynamoDBStreamEvent,
  ScheduledEvent,
  SNSEvent,
  SQSRecord,
} from 'aws-lambda'
export type AnyEvent =
  | APIGatewayProxyEvent
  | CloudFrontRequestEvent
  | DynamoDBStreamEvent
  | ScheduledEvent
  | SNSEvent
  | SQSRecord
