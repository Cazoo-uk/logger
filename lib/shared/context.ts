import { Context } from 'aws-lambda'
import { LoggerOptions } from '../index'

function parseAccountId(arn: string): string {
  if (!arn) {
    return 'missing'
  }
  const parts = arn.split(':')
  if (parts.length >= 5) {
    return parts[4]
  }
  return `unknown (${arn})`
}

export function has(obj: any, ...props: string[]): boolean {
  for (const p of props) {
    if (!obj.hasOwnProperty(p)) {
      return false
    }
  }
  return true
}

export interface LoggerContext {
  request_id: string
  account_id: string
  function: {
    name: string
    version: string
    service?: string
  }
  [property: string]: any
}

export function makeContext(
  ctx: Context,
  options: LoggerOptions,
  extra: any
): LoggerContext {
  return {
    request_id: ctx.awsRequestId,
    account_id: parseAccountId(ctx.invokedFunctionArn),
    function: {
      name: ctx.functionName,
      version: ctx.functionVersion,
      service:
        (options && options.service) ||
        process.env.CAZOO_LOGGER_SERVICE ||
        'Unknown',
    },
    ...extra,
  }
}
