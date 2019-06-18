import * as Pino from 'pino'

export function domainEvent (params) {
  return Pino({
    timestamp: false,
    base: {
      context: {
        request_id: params.context.awsRequestId,
        function: {
          name: params.context.functionName,
          version: params.context.functionVersion,
          service: params.context.logStreamName
        },
          event: {
              source: params.event.source,
              type: params.event['detail-type'],
              id: params.event.id
          }
      }
    },
    useLevelLabels: true
  }, params.stream)
}
