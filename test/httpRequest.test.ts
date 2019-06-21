const { test } = require('tap')
const logger = require('../lib')
const {sink, once} = require('./helper')

const event = {
    'account': '123456789012',
    'region': 'us-east-2',
    'detail': {},
    'detail-type': 'Scheduled Event',
    'source': 'aws.events',
    'time': '2019-03-01T01:23:45Z',
    'id': 'cdc73f9d-aea9-11e3-9d5a-835b769c0d9c',
    'resources': [
        'arn:aws:events:us-east-1:123456789012:rule/my-schedule'
    ]
}

const context = {
    functionName: 'my-function',
    functionVersion: 'v1.0.1',
    awsRequestId: 'request-id',
    logGroupName: 'log-group',
    logStreamName: 'log-stream'
}

test('When recording an outbound HTTP request', async ({ match, is }) =>{

    let log = logger.domainEvent(event, context, {stream, level: 'debug' })
    log = log.startHttpRequest({
        url: 'http://google.com',
        method: 'get'
    })
    log.completeHttpRequest({status: 200})

    const request = await once(stream, 'data')
    const response = await once(stream, 'data')

    match(request.data, {
        level: 'debug',
        v: 1,
        context: {
            request_id: context.awsRequestId,
            function: {
                name: context.functionName,
                version: context.functionVersion,
                service: context.logStreamName
            },
            event: {
                source: 'aws.events',
                type: 'Scheduled Event',
                id: event.id
            }
        },
        msg: 'Hello world'
    })
})
