const { test } = require('tap')
const logger = require('../lib')
const { sink } = require('./helper')

test('When including data', async ({ match, is }) => {
    const stream = sink()

    let log = logger.empty({ stream, level: 'debug' })
    log.withData({'a':1, 'b': 2}).debug('a thing happened')
    const request = stream.read()

    match(request, {
        level: 'debug',
        msg: 'a thing happened',
        data: {
            a: 1,
            b: 2
        }
    })
})