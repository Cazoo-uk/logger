import { test } from 'tap'
import * as logger from '../lib'
import { sink } from './helper'

test('When logging at debug', async ({ match }) => {
  const stream = sink()

  const log = logger.empty({ stream, level: 'debug' })
  log.debug('a thing happened')
  const request = stream.read()

  match(request, {
    level: 'debug',
    msg: 'a thing happened',
  })
})

test('When logging at info', async ({ is }) => {
  const stream = sink()

  const log = logger.empty({ stream })
  log.debug('a thing happened')
  const request = stream.read()

  is(null, request)
})
