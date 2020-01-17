import { Logger } from '../index'

export function combineWithBoundContext(logger: Logger, data: object) {
  const bindings: any = (logger as any).bindings()
  const context = bindings.context
  const mergedContext = {
    ...context,
    ...data,
  }
  return mergedContext
}
