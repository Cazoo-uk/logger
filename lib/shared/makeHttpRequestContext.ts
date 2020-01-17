import uuid from 'uuid/v4'

export function makeHttpRequestContext(url: string, method: string, body: any) {
  const requestId = uuid()
  const context = {
    data: {
      http: {
        req: {
          id: requestId,
          url,
          method,
          body,
        },
      },
    },
  }
  return context
}
