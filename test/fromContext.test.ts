import { Context } from 'aws-lambda'
import * as logger from '../lib'
import { sink } from './helper'
import { AnyEvent } from '../lib/events/anyEvent'

describe('[fromContext]', () => {
  const msg = 'some-msg'
  const level = 'debug'
  const data = { c: 'd' }
  const expected = { level, msg, data }

  it('propogates LoggerOptions correctly when withData is used', () => {
    const stream = sink()
    logger
      .fromContext({} as AnyEvent, {} as Context, { stream, level })
      .withData(data)
      .debug(msg)
    const actual = stream.read()
    expect(actual).toMatchObject(expected)
  })

  it('propogates LoggerOptions correctly when withData has been chained', () => {
    const stream = sink()
    logger
      .fromContext({} as AnyEvent, {} as Context, { stream, level })
      .withData({ a: 'b' })
      .withData(data)
      .debug(msg)
    const actual = stream.read()
    expect(actual).toMatchObject(expected)
  })

  it('works with an undefined config', () => {
    const log = logger.fromContext({} as AnyEvent, {} as Context)
    log.withData({ a: 'b' }).debug('test')
    expect(log).toBeDefined()
  })
})
