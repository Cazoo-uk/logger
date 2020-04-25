# Cazoo Logger

A highly opinionated structured logger for NodeJS Lambda functions.

## Installation

Cazoo Logger is available on [npm](https://www.npmjs.com/package/cazoo-logger)

```
npm i cazoo-logger
```

## Basic usage

Cazoo-logger builds logger instances from the event and context of your lambda handler. The constructed loggers write JSON blobs to stdout which include a `context` section.

```
import { CloudwatchEvent, Context} from 'aws-lambda'
import Logger from 'cazoo-logger'

function handle(event: CloudwatchEvent, context: Context) {

  const log = Logger.fromContext(event, context)
  log.info("handler invoked")
}

/* 
{
    level: 'info',
    msg: 'handler invoked',
    v: 1,
    context: {
      request_id: "abc234",
      account_id: 01246545248719,
      function: {
        name: "my-handler",
        version: context.functionVersion,
        service: context.logStreamName,
        stage: event.requestContext.stage
      },
      event: {
        source: "aws.events",
        type: "Scheduled Event",
        id: "89170034-9c85-4ae4-b9df-04207ab07dad"
      }
    }
  }
*/
```

## Logging structured data

Alongside the `context` field, our log schema defines a `data` field for recording arbitrary structured data.

```
const customer = { age: 57, name: 'karen' }
const log = Logger.empty()

log.withData({customer}).info("Customer entered the store")

/*
{
  level: 'info',
  msg: 'Customer entered the store',
  v: 1,
  data: {
    customer: {
      name: 'karen',
      age: 57
    }
  }
}
*/
```

## Logging errors

Errors are treated as a special case of structured data, and can be written to the log with the `recordError` method.

```
const error = new Error('A thing you wish had worked did not, in fact, work')
const log = Logger.empty()

log.recordError(error, 'something broke')

/**
{
    level: 'error',
    msg: "Huh... that didn't work",
    error: {
      message: "A thing you wish had worked did not, in fact work",
      stack: [...],
      name: "Error"
    }
}
**/
```

Since the `withData` method returns a new logger, we can chain these ideas together.

```
function handle(event: AwsGatewayProxyEvent, context: Context) {
  
  const customer = readCustomerFrom(event)
  const log = Logger.forAPIGatewayEvent(event, context).withData({customer})
  
  try {
      saveCustomerToDatabase(customer)
  } catch (e) {
      log.recordError(e)
  }
}

/**

{
    level: 'error',
    msg: "Failed to save customer to database",
    context: {
      request_id: "abc1234592823645",
      account_id: "01246545248719",
      function: {
         name: "insert-customer",
         version: "v10.7.2",
         stage: "dev"
      },
      http: {
         method: "POST",
         path: "/customers" 
      },
    },
    data: {
      customer: {
        name: 'karen',
        age: 57
      }
    },
    error: {
      message: "Failed to save customer to database",
      stack: [...],
      name: "ConnectionError"
    }
}
**/

```
