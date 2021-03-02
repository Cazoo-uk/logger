import { HandlerWithLogger, withLambdaLogger } from '../lib/withLambdaLogger'
import { Handler } from 'aws-lambda'
import { AnyEvent } from '../lib/events/anyEvent'

const mockedLogger = {
  done: jest.fn(),
  recordError: jest.fn(),
}

jest.mock('../lib', () => ({
  fromContext: jest.fn(() => mockedLogger),
}))

describe('augmenting lambda context with a correctly initialised helper', () => {
  const mockedEvent = {} as AnyEvent
  const mockedContext = {} as any
  const mockedCallback = {} as any

  it('should call the handler with the same args it receives', () => {
    const handler: HandlerWithLogger = jest.fn()
    const augmentedHandler = withLambdaLogger(handler)
    augmentedHandler(mockedEvent, mockedContext, mockedCallback)

    expect(handler).toHaveBeenCalledWith(
      mockedEvent,
      expect.objectContaining(mockedCallback),
      mockedContext
    )
  })

  it('should add the logger in the context', done => {
    const handler: HandlerWithLogger = (_event, augmentedContext) => {
      expect(augmentedContext.logger).toEqual(mockedLogger)
      done()
    }

    const augmentedHandler = withLambdaLogger(handler as Handler)
    augmentedHandler(mockedEvent, mockedContext, mockedCallback)
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
      let augmentedHandler: HandlerWithLogger
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