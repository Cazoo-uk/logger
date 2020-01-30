import * as logger from '../lib'
import { sink } from './helper'

describe('[empty]', () => {
  const msg = 'some-msg'
  const level = 'debug'
  const data = { c: 'd' }
  const expected = { level, msg, data }

  it('propogates LoggerOptions correctly when withData is used', () => {
    const stream = sink()
    logger
      .empty({ stream, level })
      .withData(data)
      .debug(msg)
    const actual = stream.read()
    expect(actual).toMatchObject(expected)
  })

  it('propogates LoggerOptions correctly when withData has been chained', () => {
    const stream = sink()
    logger
      .empty({ stream, level })
      .withData({ a: 'b' })
      .withData(data)
      .debug(msg)
    const actual = stream.read()
    expect(actual).toMatchObject(expected)
  })
})
