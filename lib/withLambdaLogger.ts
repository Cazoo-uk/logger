import { Context } from 'aws-lambda'
import { Callback } from 'aws-lambda/handler'
import * as Logger from './index'
import { AnyEvent } from './events/anyEvent'
import { LoggerMock } from './logger-mock'

export interface ContextWithLogger extends Context {
  logger: Logger.Logger
}

export type HandlerWithLogger<TEvent = any, TResult = any> = (
  event: TEvent,
  context: ContextWithLogger,
  callback: Callback<TResult>
) => void | Promise<TResult>

export const withLambdaLogger = <TEvent extends AnyEvent, TResult>(
  handler: HandlerWithLogger<TEvent, TResult>
): HandlerWithLogger<TEvent, TResult> => async (
  event,
  context,
  callback
): Promise<TResult> => {
  let logger

  if (
    process.env.JEST_WORKER_ID === undefined ||
    process.env.LOGGER_MOCK_PRINT_LOGS === 'true'
  ) {
    logger = Logger.fromContext(event, context)
  } else {
    logger = LoggerMock.initInstance()
  }

  let result
  try {
    result = await handler(event, { ...context, logger }, callback)
    logger.done()
  } catch (e) {
    logger.done()
    throw e
  }

  return result
}
