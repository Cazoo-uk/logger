import * as logger from '../lib'
import { sink } from './helper'

it('When logging at debug', async () => {
  const stream = sink()

  const log = logger.empty({ stream, level: 'debug' })
  log.debug('a thing happened')
  const request = stream.read()

  expect(request).toMatchObject({
    level: 'debug',
    msg: 'a thing happened',
  })
})

it('When logging at info', async () => {
  const stream = sink()

  const log = logger.empty({ stream })
  log.debug('a thing happened')
  const request = stream.read()

  expect(request).toBeNull()
})
