import { AnyEvent } from '../events/anyEvent'
import { isSNS, makeSNSContext } from '../events/sns'
import {
  SNSEvent,
  SQSRecord,
  DynamoDBStreamEvent,
  ScheduledEvent,
  CloudFrontRequestEvent,
  APIGatewayProxyEvent,
} from 'aws-lambda'
import { isSQSRecord, makeSQSRecordContext } from '../events/sqsRecord'
import { isDynamoDbStream, makeDynamoDbContext } from '../events/dynamoDbStream'
import { isDomainEvent, makeDomainEventContext } from '../events/domainEvent'
import {
  isCloudFrontRequest,
  makeCloudFrontContext,
} from '../events/cloudFront'
import { isApiGatewayEvent, makeApiGatewayContext } from '../events/apiGateway'
import { Context } from 'aws-lambda'
import { TelemetryOptions } from './telemetryOptions'

export function getContext(
  event: AnyEvent,
  context: Context,
  options: TelemetryOptions
): unknown {
  if (!event) return
  if (isSNS(event as SNSEvent)) {
    return makeSNSContext(context, options, event as SNSEvent)
  } else if (isSQSRecord(event as SQSRecord)) {
    return makeSQSRecordContext(context, options, event as SQSRecord)
  } else if (isDynamoDbStream(event as DynamoDBStreamEvent)) {
    return makeDynamoDbContext(event as DynamoDBStreamEvent, context, options)
  } else if (isDomainEvent(event as ScheduledEvent)) {
    return makeDomainEventContext(context, options, event as ScheduledEvent)
  } else if (isCloudFrontRequest(event as CloudFrontRequestEvent)) {
    return makeCloudFrontContext(
      event as CloudFrontRequestEvent,
      context,
      options
    )
  } else if (isApiGatewayEvent(event as APIGatewayProxyEvent)) {
    return makeApiGatewayContext(
      context,
      options,
      event as APIGatewayProxyEvent
    )
  }
}
