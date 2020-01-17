export function makeHttpResponseContext(
  req: any,
  status: number,
  body: any,
  elapsedMs: number
) {
  return {
    data: {
      http: {
        req: {
          id: req && req.id,
        },
        resp: {
          status,
          body,
          elapsedMs,
        },
      },
    },
  }
}
