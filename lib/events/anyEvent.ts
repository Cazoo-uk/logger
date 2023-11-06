import {
  APIGatewayProxyEvent,
  CloudFrontRequestEvent,
  DynamoDBStreamEvent,
  EventBridgeEvent,
  SNSEvent,
  SQSRecord,
} from 'aws-lambda'
export type AnyEvent =
  | APIGatewayProxyEvent
  | CloudFrontRequestEvent
  | DynamoDBStreamEvent
  | EventBridgeEvent<string, any>
  | SNSEvent
  | SQSRecord
