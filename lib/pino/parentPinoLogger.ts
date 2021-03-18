import Pino from 'pino'
import { createArgsNormalizer } from 'Pino/lib/tools'
import { LoggerOptions } from '../index'

const normalize = createArgsNormalizer({})

export function parentPinoLogger(
  data: object,
  options?: LoggerOptions
): { stream: any; instance: Pino.Logger } {
  options = options || {}
  const level =
    (options && options.level) || process.env.CAZOO_LOGGER_LEVEL || 'info'
  const { stream } = normalize({}, options.stream)

  return {
    instance: Pino(
      {
        timestamp: false,
        base: data,
        useLevelLabels: true,
        level,
        redact: options.redact,
      },
      stream
    ),
    stream,
  }
}
