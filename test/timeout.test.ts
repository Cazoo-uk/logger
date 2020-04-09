import { Context } from 'aws-lambda'
import * as logger from '../lib'
import { sink } from './helper'
import { AnyEvent } from '../lib/events/anyEvent'
import { event, context } from './data/awsgateway'

const timeout = 100
const timeNotToTriggerTimeout = 89
const timeToTriggerTimeout = 91
const timeToTriggerForUnderLimitTimeout = 11
const timeoutUnderLimit = 20

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
      const context = {
        getRemainingTimeInMillis: (): number => timeout,
      } as Context
      logger.fromContext({} as AnyEvent, context, { stream, level })

      jest.advanceTimersByTime(timeNotToTriggerTimeout)

      expect(stream.read()).toBeNull()
    })

    it('should log once the timeout expires', () => {
      const contextEndingSoon = {
        ...context,
        getRemainingTimeInMillis: (): number => timeout,
      } as Context
      logger.fromContext(event, contextEndingSoon, { stream, level })

      jest.advanceTimersByTime(timeToTriggerTimeout)

      expect(stream.read()).toMatchObject(expected)
    })
  })

  describe('when explicitly providing the timeout', () => {
    it('should not log before the timeout expires', () => {
      logger.fromContext({} as AnyEvent, {} as Context, {
        stream,
        level,
        timeoutAfterMs: timeout,
      })

      jest.advanceTimersByTime(timeNotToTriggerTimeout)

      expect(stream.read()).toBeNull()
    })

    it('should log once the timeout expires', () => {
      logger.fromContext({} as AnyEvent, {} as Context, {
        stream,
        level,
        timeoutAfterMs: timeout,
      })

      jest.advanceTimersByTime(timeToTriggerTimeout)

      expect(stream.read()).toMatchObject(expected)
    })

    it('should not log if the timeout is ridiculously short', () => {
      logger.fromContext({} as AnyEvent, {} as Context, {
        stream,
        level,
        timeoutAfterMs: timeoutUnderLimit,
      })

      jest.advanceTimersByTime(timeToTriggerForUnderLimitTimeout)

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
