import { Logger } from './index'

export class LoggerMock {
  // TODO implements Logger
  private constructor(public readonly printLogs = false) {}

  public static initInstance = (printLogs = false): Logger => {
    return (new LoggerMock(printLogs) as unknown) as Logger
  }

  public withData = jest.fn().mockReturnValue(this)
  public withContext = jest.fn().mockReturnValue(this)
  public debug = jest.fn(log => this.printLogs && console.log(log))
  public info = jest.fn(log => this.printLogs && console.log(log))
  public log = jest.fn(log => this.printLogs && console.log(log))
  public warn = jest.fn(log => this.printLogs && console.log(log))
  public error = jest.fn(log => this.printLogs && console.log(log))
  public fatal = jest.fn(log => this.printLogs && console.log(log))
  public recordError = (e: Error, msg?: string) =>
    this.printLogs &&
    console.log(`[Error] ${JSON.stringify(e.message)} ${msg || ''}`)
  public withHttpRequest = jest.fn().mockReturnValue(this)
  public withHttpResponse = jest.fn().mockReturnValue(this)
  readonly LOG_VERSION: number
}
