import { Context } from 'aws-lambda'
import { Callback } from 'aws-lambda/handler'
import * as Logger from './index'
import { AnyEvent } from './events/anyEvent'

export interface ContextWithLogger extends Context {
  logger: Logger.Logger
}

export type HandlerWithLogger<TEvent = any, TResult = any> = (
  event: TEvent,
  context: ContextWithLogger,
  callback: Callback<TResult>
) => void | Promise<TResult>

export const withLambdaLogger = <TEvent extends AnyEvent, TResult>(
  handler: HandlerWithLogger<TEvent, TResult>,
  options?: Logger.LoggerOptions
): HandlerWithLogger<TEvent, TResult> => async (
  event,
  context,
  callback
): Promise<TResult> => {
  const logger = Logger.fromContext(event, context, options)

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
