import * as logger from '../index'

export function getRequestFromBindings(logger: logger.Logger) {
  const bindings: any = (logger as any).bindings()
  return (
    bindings && bindings.data && bindings.data.http && bindings.data.http.req
  )
}
