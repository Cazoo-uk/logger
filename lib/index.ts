import * as Pino from 'pino'

interface LogFn {
    (msg: string, ...args: any[]): void;
    (obj: object, msg?: string, ...args: any[]): void;
}


class Logger {
    instance: Pino.Logger

    constructor (context, stream?) {
      this.instance = Pino({
        timestamp: false,
        base: { context },
        useLevelLabels: true
      }, stream)
    }

    info(msg: string, ...args: any[]): void;
    info(obj: object, msg?: string, ...args: any[]): void;
    info(msgOrString, ...args) {
        
    }

    }
}

export function domainEvent (params) {
  return new Logger({
    request_id: params.context.awsRequestId,
    function: {
      name: params.context.functionName,
      version: params.context.functionVersion,
      service: params.service || params.context.logStreamName
    },
    event: {
      source: params.event.source,
      type: params.event['detail-type'],
      id: params.event.id
    }

  }, params.stream)
}
