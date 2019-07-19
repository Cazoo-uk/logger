const { test } = require('tap')
const logger = require('../lib')
const { sink } = require('./helper')

test('When logging at debug', async ({ match, is }) => {
  const stream = sink()

  let log = logger.empty({ stream, level: 'debug' })
  log.debug('a thing happened')
  const request = stream.read()

  match(request, {
    level: 'debug',
    msg: 'a thing happened'
  })
})

test('When logging at info', async ({ is }) => {
  const stream = sink()

  let log = logger.empty({ stream })
  log.debug('a thing happened')
  const request = stream.read()

  is(null, request)
})
