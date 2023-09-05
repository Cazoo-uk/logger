import { v4 as uuidv4 } from 'uuid'

export function makeHttpRequestContext(url: string, method: string, body: any) {
  const requestId = uuidv4()
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
