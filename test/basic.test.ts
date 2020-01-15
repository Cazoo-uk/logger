import * as logger from '../lib'
import { sink } from './helper'

it('acceptance', () => {
  logger
    .empty()
    .withData({ foo: 'bar' })
    .info('hello world')
})

it('When including data', () => {
  const stream = sink()

  const log = logger.empty({ stream, level: 'debug' })
  log.withData({ a: 1, b: 2 }).debug('a thing happened')
  const request = stream.read()

  expect(request).toMatchObject({
    level: 'debug',
    msg: 'a thing happened',
    data: {
      a: 1,
      b: 2,
    },
  })
})

it('When options are set in the environment', () => {
  const stream = sink()

  process.env.CAZOO_LOGGER_LEVEL = 'debug'

  const log = logger.empty({ stream })
  log.debug('random fandom')
  const request = stream.read()

  expect(request).toMatchObject({
    level: 'debug',
    msg: 'random fandom',
  })
})
