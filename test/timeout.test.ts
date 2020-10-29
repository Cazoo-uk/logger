import { Context } from 'aws-lambda'
import * as logger from '../lib'
import { getTimeoutBuffer } from '../lib/timeout'
import { sink } from './helper'
import { AnyEvent } from '../lib/events/anyEvent'
import { event, context } from './data/awsgateway'

const timeout = 100
const timeNotToTriggerTimeout = 89
const timeToTriggerTimeout = 91
const timeToTriggerForUnderLimitTimeout = 11
const timeoutUnderLimit = 20

describe('setting up the timeout buffer', () => {
  describe('when not passing a value', () => {
    it('should use the default of 10', () => {
      const expected = 10
      const actual = getTimeoutBuffer()
      expect(actual).toBe(expected)
    })
  })

  describe('when passing a numeric value', () => {
    it('should use the passed numeric value', () => {
      const expected = 5
      process.env.CAZOO_LOGGER_TIMEOUT_BUFFER_MS = '5'
      const actual = getTimeoutBuffer()
      expect(actual).toBe(expected)
    })
  })

  describe('when passing a non-numeric value', () => {
    it('should use the default of 10', () => {
      const expected = 10
      process.env.CAZOO_LOGGER_TIMEOUT_BUFFER_MS = 'd'
      const actual = getTimeoutBuffer()
      expect(actual).toBe(expected)
    })
  })
})

describe('Preemptive logging of lambda timeouts', () => {
  const msg = 'Lambda Timeout'
  const type = 'lambda.timeout'
  const level = 'error'
  const expected = { level, type, msg }
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

      const actual = stream.read()
      expect(actual).toMatchObject(expected)
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

    it('should not trigger timeout twice when recreating the logger', () => {
      const testLogger = logger.fromContext(event, {} as Context, {
        stream,
        level,
        timeoutAfterMs: timeToTriggerTimeout,
      })

      jest.advanceTimersByTime(timeToTriggerTimeout)
      expect(stream.read()).toMatchObject(expected)

      // calling `withData` will recreate the logger - potentially triggering the lambda timout setup code
      testLogger.withData({ some: 'data' })

      jest.advanceTimersByTime(timeToTriggerTimeout)
      expect(stream.read()).toBeNull()
    })

    it('should be able to "done" a timeout from a child logger', () => {
      const log = logger
        .fromContext(event, {} as Context, {
          stream,
          level,
          timeoutAfterMs: timeToTriggerTimeout,
        })
        .withData({ ...event })

      log.done()

      jest.advanceTimersByTime(timeToTriggerTimeout)
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
