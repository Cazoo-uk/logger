import { Context, Handler } from 'aws-lambda'
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
): Handler<TEvent, TResult> => (
  event,
  context,
  callback
): void | Promise<TResult> => {
  const loggerFactory = options?.loggerFactory || fromContext
  const logger = loggerFactory(event, context, options)

  const myCallback = (error, success) => {
    if (error) {
      logger.done()
      callback(error)
    }
    if (success) {
      logger.done()
      callback(null, success)
    }
  }

  const result = handler(event, { ...context, logger }, myCallback)
  if (result instanceof Promise) {
    return result.finally(() => logger.done())
  }
}
