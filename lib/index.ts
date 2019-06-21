import * as Pino from 'pino'
import { Context, APIGatewayProxyEvent } from 'aws-lambda'

interface LogFn {
    (msg: string, ...args: any[]): void;
    (obj: object, msg?: string, ...args: any[]): void;
}

function withData (data) {
    return this.child({data});
}

function makeLogger (data: object, parent?: Pino.Logger, stream?) {
    let instance: Pino.Logger;

    if (parent === undefined) {
        instance = Pino({
            timestamp: false,
            base: data,
            useLevelLabels: true
        }, stream)
    } else {
        instance = parent.child(data)
    }
    Object.assign(instance, {
        withData
    })

    return instance
}

export function domainEvent (params) {
    return makeLogger({ context: {
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
     }
    }, undefined, params.stream)
}

export function apiGatewayEvent (event: APIGatewayProxyEvent, context: Context, stream?) {
    return makeLogger({ context: {
        request_id: context.awsRequestId,
        account_id: event.requestContext.accountId,
        function: {
            name: context.functionName,
            version: context.functionVersion,
            service: context.logStreamName,
            stage: event.requestContext.stage
        },
        http: {
            path: event.path,
            method: event.httpMethod
        }
    }
    }, undefined, stream)
}
