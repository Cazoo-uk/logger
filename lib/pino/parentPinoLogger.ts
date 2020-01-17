import Pino from 'pino'
import { LoggerOptions } from '../index'

export function parentPinoLogger(
  data: object,
  options?: LoggerOptions
): Pino.Logger {
  const level =
    (options && options.level) || process.env.CAZOO_LOGGER_LEVEL || 'info'
  if (options && options.stream) {
    return Pino(
      {
        timestamp: false,
        base: data,
        useLevelLabels: true,
        level,
      },
      options.stream
    )
  }
  return Pino({
    timestamp: false,
    base: data,
    useLevelLabels: true,
    level,
    redact: options && options.redact,
  })
}
