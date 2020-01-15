import { test } from 'tap'
import * as logger from '../lib'
import { sink } from './helper'
import { event, context } from './data/httpRequest'

test('When recording an outbound HTTP request', async ({ match, is }) => {
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

  match(request.data, {
    http: {
      req: {
        url: 'http://google.com',
        method: 'get',
      },
    },
  })

  match(response.data, {
    http: {
      resp: {
        status: 200,
      },
    },
  })

  is(request.data.http.req.id, response.data.http.req.id)
})
