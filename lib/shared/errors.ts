import { Logger } from '../index'

function makeErrorRecord(error: any, msg?: string): ErrorRecord {
  let errorObj: Error
  if (error instanceof Error) {
    errorObj = error
  } else if (error instanceof Object) {
    errorObj = {
      message: JSON.stringify(error),
      stack: undefined,
      name: typeof error,
    }
  } else {
    errorObj = {
      message: error.toString(),
      stack: undefined,
      name: typeof error,
    }
  }
  return {
    msg: msg || errorObj.message,
    error: {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
    },
  }
}

export function recordError(this: Logger, e: any, msg?: string): void {
  this.error(makeErrorRecord(e, msg))
}

export function recordErrorAsWarning(this: Logger, e: any, msg?: string): void {
  this.warn(makeErrorRecord(e, msg))
}

interface ErrorRecord {
  msg: string
  error: {
    message: string
    stack: string
    name: string
  }
}
