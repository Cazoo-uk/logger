import * as logger from '../lib'
import { sink } from './helper'
import { event, context } from './data/httpRequest'

it('When recording an outbound HTTP request', () => {
  const stream = sink()

  let log = logger.forDomainEvent(event, context, { stream, level: 'debug' })
  log = log.withHttpRequest({
    url: 'http://google.com',
    method: 'get',
  })
  log.info({ type: 'outbound-http' })
  const request = stream.read()

  log.withHttpResponse({ status: 200 }).info('Got stuff')
  const response = stream.read()

  expect(request.data).toMatchObject({
    http: {
      req: {
        url: 'http://google.com',
        method: 'get',
      },
    },
  })

  expect(response.data).toMatchObject({
    http: {
      resp: {
        status: 200,
      },
    },
  })

  expect(request.data.http.req.id).toBe(response.data.http.req.id)
})
