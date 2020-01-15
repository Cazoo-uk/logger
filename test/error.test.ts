import { test } from 'tap'
import * as logger from '../lib'
import { sink } from './helper'

test('When logging an error', async ({ match }) => {
  const stream = sink()
  const error = new Error('A thing you wish had worked did not, in fact, work')

  const log = logger.empty({ stream })
  log.recordError(error)
  const request = stream.read()

  match(request, {
    level: 'error',
    msg: error.message,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  })
})

test('When logging an error with a custom message', async ({ match }) => {
  const stream = sink()
  const error = new Error('A thing you wish had worked did not, in fact, work')

  const log = logger.empty({ stream })
  log.recordError(error, "Huh... that didn't work")
  const request = stream.read()

  match(request, {
    level: 'error',
    msg: "Huh... that didn't work",
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  })
})

test('When logging an error as a warning', async ({ match }) => {
  const stream = sink()
  const error = new Error('A thing you wish had worked did not, in fact, work')

  const log = logger.empty({ stream })
  log.recordErrorAsWarning(error, "Huh... that didn't work")
  const request = stream.read()

  match(request, {
    msg: "Huh... that didn't work",
    level: 'warn',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  })
})

test('When some numpty throws a string as error', async ({ match }) => {
  const stream = sink()
  const log = logger.empty({ stream })

  try {
    throw 'lol' // eslint-disable-line no-throw-literal
  } catch (s) {
    log.recordError(s)
  }

  const request = stream.read()
  match(request, {
    msg: 'lol',
    level: 'error',
    error: {
      message: 'lol',
      name: 'string',
    },
  })
})

test('When some numpty throws an object as error', async ({ match }) => {
  const stream = sink()
  const log = logger.empty({ stream })

  try {
    throw { someProp: 'someVal', someProp2: 'someVal2' }
  } catch (s) {
    log.recordError(s)
  }

  const request = stream.read()
  match(request, {
    msg: '{"someProp":"someVal","someProp2":"someVal2"}',
    level: 'error',
    error: {
      message: '{"someProp":"someVal","someProp2":"someVal2"}',
      name: 'object',
    },
  })
})
