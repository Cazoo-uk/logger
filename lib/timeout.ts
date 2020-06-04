const defaultBufferMS = 10

export const getTimeoutBuffer = (): number => {
  const sTimeoutBuffer =
    process.env.CAZOO_LOGGER_TIMEOUT_BUFFER_MS || `${defaultBufferMS}`
  const timeoutBuffer = parseInt(sTimeoutBuffer)

  if (isNaN(timeoutBuffer)) {
    process.stderr.write(
      `Unable to parse non-numeric logger timeout buffer '${process.env.CAZOO_LOGGER_TIMEOUT_BUFFER_MS}'`
    )
    return defaultBufferMS
  }

  return timeoutBuffer
}

export function done(this: TimeoutLogger) {
    if (this.timeout) clearTimeout(this.timeout)
}

export interface TimeoutLogger {
  done(): void
  timeout?: NodeJS.Timeout
}
