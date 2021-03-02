import { Context } from 'aws-lambda'
import { Callback } from 'aws-lambda/handler'
import { AnyEvent } from './events/anyEvent'
import { fromContext, Logger, LoggerOptions } from './index'

export interface ContextWithLogger extends Context {
  logger: Logger
}

export type HandlerWithLogger<TEvent = any, TResult = any> = (
  event: TEvent,
  context: ContextWithLogger,
  callback: Callback<TResult>
) => void | Promise<TResult>

export type LoggerFactory = (
  event: AnyEvent,
  context: Context,
  options?: LoggerOptions
) => Logger

export interface WithLambdaLoggerOptions extends LoggerOptions {
  loggerFactory?: LoggerFactory
}

export const withLambdaLogger = <TEvent extends AnyEvent, TResult>(
  handler: HandlerWithLogger<TEvent, TResult>,
  options?: WithLambdaLoggerOptions
): HandlerWithLogger<TEvent, TResult> => async (
  event,
  context,
  callback
): Promise<TResult> => {
  const loggerFactory = options?.loggerFactory || fromContext
  const logger = loggerFactory(event, context, options)

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
