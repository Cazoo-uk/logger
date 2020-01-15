import * as logger from '../lib'
import { sink } from './helper'

it('When logging an error', async () => {
  const stream = sink()
  const error = new Error('A thing you wish had worked did not, in fact, work')

  const log = logger.empty({ stream })
  log.recordError(error)
  const request = stream.read()

  expect(request).toMatchObject({
    level: 'error',
    msg: error.message,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  })
})

it('When logging an error with a custom message', async () => {
  const stream = sink()
  const error = new Error('A thing you wish had worked did not, in fact, work')

  const log = logger.empty({ stream })
  log.recordError(error, "Huh... that didn't work")
  const request = stream.read()

  expect(request).toMatchObject({
    level: 'error',
    msg: "Huh... that didn't work",
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  })
})

it('When logging an error as a warning', async () => {
  const stream = sink()
  const error = new Error('A thing you wish had worked did not, in fact, work')

  const log = logger.empty({ stream })
  log.recordErrorAsWarning(error, "Huh... that didn't work")
  const request = stream.read()

  expect(request).toMatchObject({
    msg: "Huh... that didn't work",
    level: 'warn',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
  })
})

it('When some numpty throws a string as error', async () => {
  const stream = sink()
  const log = logger.empty({ stream })

  try {
    throw 'lol' // eslint-disable-line no-throw-literal
  } catch (s) {
    log.recordError(s)
  }

  const request = stream.read()
  expect(request).toMatchObject({
    msg: 'lol',
    level: 'error',
    error: {
      message: 'lol',
      name: 'string',
    },
  })
})

it('When some numpty throws an object as error', async () => {
  const stream = sink()
  const log = logger.empty({ stream })

  try {
    throw { someProp: 'someVal', someProp2: 'someVal2' }
  } catch (s) {
    log.recordError(s)
  }

  const request = stream.read()
  expect(request).toMatchObject({
    msg: '{"someProp":"someVal","someProp2":"someVal2"}',
    level: 'error',
    error: {
      message: '{"someProp":"someVal","someProp2":"someVal2"}',
      name: 'object',
    },
  })
})
