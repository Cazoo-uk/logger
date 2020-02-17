import { CloudFrontRequestEvent, Context, CloudFrontEvent } from 'aws-lambda'
import { makeContext, LoggerContext } from '../shared/context'
import { LoggerOptions } from '../index'

type EventTypeWithRequestId = {
  eventType: 'viewer-request' | 'viewer-response'
  readonly requestId: string
}
type EventTypeWithoutRequestId = {
  eventType: 'origin-request' | 'origin-response'
}

function convert(
  config: EventTypeWithoutRequestId | EventTypeWithRequestId
): EventTypeWithRequestId {
  if (
    config.eventType === 'viewer-request' ||
    config.eventType === 'viewer-response'
  ) {
    return config
  }

  return undefined
}

function getRequestId(event: CloudFrontEvent): string {
  const config = event.config
  const converted: EventTypeWithRequestId = convert(config)
  if (converted) {
    return converted.requestId
  }
  return undefined
}

export function isCloudFrontRequest(request: CloudFrontRequestEvent): boolean {
  return !(
    !Array.isArray(request.Records) || request.Records[0].cf === undefined
  )
}

export function makeCloudFrontContext(
  request: CloudFrontRequestEvent,
  context: Context,
  options: LoggerOptions
): LoggerContext {
  const cf = request.Records[0].cf
  const requestId = getRequestId(cf)

  const ctx = makeContext(context, options, {
    cf: {
      path: cf.request.uri,
      method: cf.request.method,
      dist: cf.config.distributionId,
      type: cf.config.eventType,
      id: requestId,
    },
  })
  return ctx
}
