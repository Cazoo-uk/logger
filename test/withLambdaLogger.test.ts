import {
  HandlerWithLogger,
  LoggerFactory,
  withLambdaLogger,
  WithLambdaLoggerOptions,
} from '../lib/withLambdaLogger'
import { Callback, Context, Handler } from 'aws-lambda'
import { AnyEvent } from '../lib/events/anyEvent'
import { fromContext } from '../lib'

const mockedLogger = {
  done: jest.fn(),
  recordError: jest.fn(),
}

jest.mock('../lib', () => ({
  fromContext: jest.fn(() => mockedLogger),
}))

describe('augmenting lambda context with a correctly initialised helper', () => {
  const mockedEvent = { source: 'a-service' } as AnyEvent
  const mockedContext: Context = { functionName: 'a-lambda' } as Context
  const mockedCallback: Callback = () => undefined
  const handler: HandlerWithLogger = jest.fn()

  describe('initialise a logger', () => {
    it('should call the handler with the same args it receives', () => {
      const augmentedHandler = withLambdaLogger(handler)
      augmentedHandler(mockedEvent, mockedContext, mockedCallback)

      expect(handler).toHaveBeenCalledWith(
        mockedEvent,
        expect.objectContaining(mockedContext),
        mockedCallback
      )
    })

    it('should pass the initialised logger to the handler through the context', async () => {
      const augmentedHandler = withLambdaLogger(handler)
      await augmentedHandler(mockedEvent, mockedContext, mockedCallback)
      expect(handler).toHaveBeenCalledWith(
        mockedEvent,
        expect.objectContaining({ logger: mockedLogger }),
        mockedCallback
      )
    })

    describe('with optional parameters', () => {
      const options: WithLambdaLoggerOptions = { timeoutAfterMs: 10000 }

      it('should provide an interface for passing options to the logger', () => {
        const augmentedHandler = withLambdaLogger(handler, options)
        augmentedHandler(mockedEvent, mockedContext, mockedCallback)

        expect(fromContext).toHaveBeenCalledWith(
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
        const handler: HandlerWithLogger = () => Promise.resolve()
        const optionsWithLoggerFactory: WithLambdaLoggerOptions = {
          ...options,
          loggerFactory: (mockedCustomLoggerFactory as any) as LoggerFactory,
        }

        const augmentedHandler = withLambdaLogger(
          handler,
          optionsWithLoggerFactory
        )
        await augmentedHandler(mockedEvent, mockedContext, mockedCallback)

        expect(mockedCustomLoggerFactory).toHaveBeenCalledWith(
          mockedEvent,
          mockedContext,
          optionsWithLoggerFactory
        )
        expect(mockedCustomLogger.done).toHaveBeenCalled()
      })
    })
  })

  describe('using the Lambda handler promise interface', () => {
    it('should return whatever the handler will return', async () => {
      const handler = () => Promise.resolve('the response')
      const augmentedHandler = withLambdaLogger(handler)

      await expect(
        augmentedHandler(mockedEvent, mockedContext, mockedCallback)
      ).resolves.toEqual('the response')
    })

    it('should close the logger when the lambda returns', async () => {
      const handler: Handler = () => Promise.resolve('the response')
      const augmentedHandler = withLambdaLogger(handler)
      await augmentedHandler(mockedEvent, mockedContext, mockedCallback)

      expect(mockedLogger.done).toBeCalled()
    })

    describe('when the Lambda throws', () => {
      let augmentedHandler: Handler

      beforeEach(() => {
        const handler: Handler = () => {
          throw new Error('Doh!')
        }
        augmentedHandler = withLambdaLogger(handler)
      })

      it('should throw whatever the lambda throws', async () => {
        await expect(
          augmentedHandler(mockedEvent, mockedContext, mockedCallback)
        ).rejects.toThrow('Doh!')
      })

      it('should leave the logging responsibility to the consumer', async () => {
        try {
          await augmentedHandler(mockedEvent, mockedContext, mockedCallback)
          fail()
        } catch {
          expect(mockedLogger.recordError).not.toBeCalled()
        }
      })

      it('should close the logger', async () => {
        try {
          await augmentedHandler(mockedEvent, mockedContext, mockedCallback)
          fail()
        } catch {
          expect(mockedLogger.done).toBeCalled()
        }
      })
    })
  })

  it.todo('should support the callback interface')
})
