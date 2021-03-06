import { Callback, Context, Handler } from 'aws-lambda'
import { AnyEvent } from '../lib/events/anyEvent'
import * as Logger from '../lib'

const mockedLogger = ({
  done: jest.fn(),
  recordError: jest.fn(),
} as any) as Logger.Logger

const fromContextSpy = jest.spyOn(Logger, 'fromContext')

describe('augmenting lambda context with a correctly initialised helper', () => {
  const mockedEvent = { source: 'a-service' } as AnyEvent
  const mockedContext: Context = { functionName: 'a-lambda' } as Context
  const handler = jest.fn()

  beforeEach(() => {
    fromContextSpy.mockImplementation(() => mockedLogger)
  })

  describe('initialise a logger', () => {
    it('should call the handler with the same args it receives', () => {
      const augmentedHandler = Logger.withLambdaLogger(handler)
      augmentedHandler(mockedEvent, mockedContext, undefined)

      expect(handler).toHaveBeenCalledWith(
        mockedEvent,
        expect.objectContaining(mockedContext),
        expect.anything()
      )
    })

    it('should pass the initialised logger to the handler through the context', async () => {
      const augmentedHandler = Logger.withLambdaLogger(handler)
      await augmentedHandler(mockedEvent, mockedContext, undefined)
      expect(handler).toHaveBeenCalledWith(
        mockedEvent,
        expect.objectContaining({ logger: mockedLogger }),
        expect.anything()
      )
    })

    describe('with optional parameters', () => {
      const options: Logger.WithLambdaLoggerOptions = { timeoutAfterMs: 10000 }

      it('should provide an interface for passing options to the logger', () => {
        const augmentedHandler = Logger.withLambdaLogger(handler, options)
        augmentedHandler(mockedEvent, mockedContext, undefined)
        expect(fromContextSpy).toHaveBeenCalledWith(
          mockedEvent,
          mockedContext,
          options
        )
      })

      it('should provide an option to hook in a custom logger', async () => {
        const mockedCustomLogger = {
          done: jest.fn(),
        }
        const mockedCustomLoggerFactory = jest.fn(() => mockedCustomLogger)
        const handler = () => Promise.resolve()
        const optionsWithLoggerFactory: Logger.WithLambdaLoggerOptions = {
          ...options,
          loggerFactory: (mockedCustomLoggerFactory as any) as Logger.LoggerFactory,
        }

        const augmentedHandler = Logger.withLambdaLogger(
          handler,
          optionsWithLoggerFactory
        )
        await augmentedHandler(mockedEvent, mockedContext, undefined)

        expect(mockedCustomLoggerFactory).toHaveBeenCalledWith(
          mockedEvent,
          mockedContext,
          optionsWithLoggerFactory
        )
        expect(mockedCustomLogger.done).toHaveBeenCalled()
      })
    })
  })

  describe('when the handler throws', () => {
    let augmentedHandler: Handler
    const myError = new Error('Doh!')

    beforeEach(() => {
      const handler: Handler = () => {
        throw myError
      }
      augmentedHandler = Logger.withLambdaLogger(handler)
    })

    it('should thrown whatever has been thrown', () => {
      try {
        augmentedHandler(mockedEvent, mockedContext, undefined)
        fail()
      } catch (e) {
        expect(e).toBe(myError)
      }
    })

    it('should leave the logging responsibility to the consumer', () => {
      try {
        augmentedHandler(mockedEvent, mockedContext, undefined)
        fail()
      } catch {
        expect(mockedLogger.recordError).not.toBeCalled()
      }
    })

    it('should close the logger', () => {
      try {
        augmentedHandler(mockedEvent, mockedContext, undefined)
        fail()
      } catch {
        expect(mockedLogger.done).toBeCalled()
      }
    })
  })

  describe('using the Lambda handler promise interface', () => {
    describe('when the handler promise resolves', () => {
      it('should return whatever the handler will return', async () => {
        const handler = () => Promise.resolve('the response')
        const augmentedHandler = Logger.withLambdaLogger(handler)

        await expect(
          augmentedHandler(mockedEvent, mockedContext, undefined)
        ).resolves.toEqual('the response')
      })

      it('should close the logger', async () => {
        const handler: Handler = () => Promise.resolve('the response')
        const augmentedHandler = Logger.withLambdaLogger(handler)
        await augmentedHandler(mockedEvent, mockedContext, undefined)

        expect(mockedLogger.done).toBeCalled()
      })
    })

    describe('when the handler promise rejects', () => {
      let augmentedHandler: Handler

      beforeEach(() => {
        const handler: Handler = () => Promise.reject('Doh!')
        augmentedHandler = Logger.withLambdaLogger(handler)
      })

      it('should return whatever has been rejected', async () => {
        await expect(
          augmentedHandler(mockedEvent, mockedContext, undefined)
        ).rejects.toEqual('Doh!')
      })

      it('should leave the logging responsibility to the consumer', async () => {
        try {
          await augmentedHandler(mockedEvent, mockedContext, undefined)
          fail()
        } catch {
          expect(mockedLogger.recordError).not.toBeCalled()
        }
      })

      it('should close the logger', async () => {
        try {
          await augmentedHandler(mockedEvent, mockedContext, undefined)
          fail()
        } catch {
          expect(mockedLogger.done).toBeCalled()
        }
      })
    })
  })

  describe('using the Lambda handler callback interface', () => {
    const mockSuccessCb = jest.fn()
    const mockErrorCb = jest.fn()

    const mockedCallback: Callback = (error, success) => {
      if (error) mockErrorCb(error)
      if (success) mockSuccessCb(success)
    }

    describe('when the handler calls the success callback', () => {
      it('should return whatever the handler will return', done => {
        const handler: Handler = (_event, _context, callback) => {
          callback(null, 'the response')
          expect(mockSuccessCb).toBeCalledWith('the response')
          done()
        }
        const augmentedHandler = Logger.withLambdaLogger(handler)
        augmentedHandler(mockedEvent, mockedContext, mockedCallback)
      })

      it('should close the logger', done => {
        const handler: Handler = (_event, _context, callback) => {
          callback(null, 'the response')
          expect(mockedLogger.done).toBeCalled()
          done()
        }
        const augmentedHandler = Logger.withLambdaLogger(handler)
        augmentedHandler(mockedEvent, mockedContext, mockedCallback)
      })
    })

    describe('when the handler calls the error callback', () => {
      it('should return whatever error the handler returns', done => {
        const handler: Handler = (_event, _context, callback) => {
          callback('the error')
          expect(mockErrorCb).toBeCalledWith('the error')
          done()
        }
        const augmentedHandler = Logger.withLambdaLogger(handler)
        augmentedHandler(mockedEvent, mockedContext, mockedCallback)
      })

      it('should leave the logging responsibility to the consumer', done => {
        const handler: Handler = (_event, _context, callback) => {
          callback('the error')
          expect(mockedLogger.recordError).not.toBeCalled()
          done()
        }
        const augmentedHandler = Logger.withLambdaLogger(handler)
        augmentedHandler(mockedEvent, mockedContext, mockedCallback)
      })

      it('should close the logger', done => {
        const handler: Handler = (_event, _context, callback) => {
          callback('the error')
          expect(mockedLogger.done).toBeCalled()
          done()
        }
        const augmentedHandler = Logger.withLambdaLogger(handler)
        augmentedHandler(mockedEvent, mockedContext, mockedCallback)
      })
    })
  })
})
