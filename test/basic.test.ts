const { test } = require('tap')
const logger = require('../lib')
const { sink } = require('./helper')

test('acceptance', ({ end }) => {
  logger.empty().withData({ foo: 'bar' }).info('hello world')
  end()
})

test('When including data', async ({ match, is }) => {
  const stream = sink()

  let log = logger.empty({ stream, level: 'debug' })
  log.withData({ 'a': 1, 'b': 2 }).debug('a thing happened')
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

test('When options are set in the environment', async ({ match }) => {
  const stream = sink()

  process.env.CAZOO_LOGGER_LEVEL = 'debug'

  let log = logger.empty({ stream })
  log.debug('random fandom')
  const request = stream.read()

  match(request, {
    level: 'debug',
    msg: 'random fandom'
  })
})
