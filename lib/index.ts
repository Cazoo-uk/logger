import * as Pino from 'pino'
import { Context, APIGatewayProxyEvent } from 'aws-lambda'
import * as uuid from 'uuid/v4'

function withData (data) {
    return this.child({data});
}

function completeHttpRequest ({status, error, body, elapsed_ms}) {
    const bindings = this.bindings()
    const req = (bindings.data && bindings.data.http && bindings.data.http.req)
    return makeLogger({
        data: {
            http: {
                req: {
                    id: req && req.id
                },
                resp: {
                  status,
                  body,
                  elapsed_ms
               }
            }
        }
    }, this)
}

function startHttpRequest ({url, method, body}) {
    const requestId = uuid()
    return makeLogger ({
        data: {
        http: {
            req: {
              id: requestId,
              url,
              method,
              body
           }
        }
      }
    }, this)
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
        withData,
        startHttpRequest,
        completeHttpRequest
    })

    return instance
}

export function domainEvent (event, context:Context, params) {
    return makeLogger({ context: {
    request_id: context.awsRequestId,
    function: {
      name: context.functionName,
      version: context.functionVersion,
      service: params.service || context.logStreamName
    },
    event: {
      source: event.source,
      type: event['detail-type'],
      id: event.id
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
