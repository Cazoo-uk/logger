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
): Handler<TEvent, TResult> => (event, context, callback) => {
  const loggerFactory = options?.loggerFactory || fromContext
  const logger = loggerFactory(event, context, options)

  const proxyCallback: Callback<TResult> = (...args) => {
    logger.done()
    callback(...args)
  }

  let result
  try {
    result = handler(event, { ...context, logger }, proxyCallback)
  } finally {
    logger.done()
  }

  if (result instanceof Promise) {
    return result.finally(() => logger.done())
  }
}
