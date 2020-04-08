import { Context } from 'aws-lambda'
import * as logger from '../lib'
import { sink } from './helper'
import { AnyEvent } from '../lib/events/anyEvent'
import { event, context } from './data/awsgateway'

describe('Preemptive logging of lambda timeouts', () => {
  const msg = 'lambda-timeout'
  const level = 'error'
  const expected = { level, msg }
  let stream

  beforeEach(() => {
    jest.useFakeTimers()
    stream = sink()
  })

  describe('when taking the timeout from context', () => {
    it('should not log before the timeout expires', () => {
      const millisRemaining = 100
      const millisToAdvance = 89
      const context = {
        getRemainingTimeInMillis: (): number => millisRemaining,
      } as Context
      logger.fromContext({} as AnyEvent, context, { stream, level })

      jest.advanceTimersByTime(millisToAdvance)

      expect(stream.read()).toBeNull()
    })

    it('should log once the timeout expires', () => {
      const millisRemaining = 100
      const millisToAdvance = 91
      const contextEndingSoon = {
        ...context,
        getRemainingTimeInMillis: (): number => millisRemaining,
      } as Context
      logger.fromContext(event, contextEndingSoon, { stream, level })

      jest.advanceTimersByTime(millisToAdvance)

      expect(stream.read()).toMatchObject(expected)
    })
  })

  describe('when explicitly providing the timeout', () => {
    it('should not log before the timeout expires', () => {
      logger.fromContext({} as AnyEvent, {} as Context, {
        stream,
        level,
        timeoutAfterMs: 100,
      })

      jest.advanceTimersByTime(89)

      expect(stream.read()).toBeNull()
    })

    it('should log once the timeout expires', () => {
      logger.fromContext({} as AnyEvent, {} as Context, {
        stream,
        level,
        timeoutAfterMs: 100,
      })

      jest.advanceTimersByTime(91)

      expect(stream.read()).toMatchObject(expected)
    })

    it('should not log if the timeout is ridiculously short', () => {
      logger.fromContext({} as AnyEvent, {} as Context, {
        stream,
        level,
        timeoutAfterMs: 20,
      })

      jest.advanceTimersByTime(11)

      expect(stream.read()).toBeNull()
    })
  })

  describe('when not providing the timeout and not providing a useful context', () => {
    it('should not blow up', () => {
      logger.fromContext({} as AnyEvent, {} as Context, undefined)

      expect(stream.read()).toBeNull()
    })
  })
})
