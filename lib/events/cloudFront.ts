import { CloudFrontRequestEvent, Context } from 'aws-lambda'
import { makeContext } from '../shared/context'
import { LoggerOptions } from '../index'

export function isCloudFrontRequest(request: CloudFrontRequestEvent) {
  return !(
    !Array.isArray(request.Records) || request.Records[0].cf === undefined
  )
}

export function makeCloudFrontContext(
  request: CloudFrontRequestEvent,
  context: Context,
  options: LoggerOptions
) {
  const cf = request.Records[0].cf
  const ctx = makeContext(context, options, {
    cf: {
      path: cf.request.uri,
      method: cf.request.method,
      dist: cf.config.distributionId,
      type: cf.config.eventType,
      id: cf.config.requestId,
    },
  })
  return ctx
}
