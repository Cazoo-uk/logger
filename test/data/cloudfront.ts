import { CloudFrontRequestEvent } from 'aws-lambda'
import { baseContext } from './baseContext'

export const context = {
  ...baseContext,
  invokedFunctionArn:
    'arn:aws:lambda:region:account-id:function:function-name:alias-name',
  functionName: 'my-function',
  functionVersion: 'v1.0.1',
  awsRequestId: 'request-id',
  logGroupName: 'log-group',
  logStreamName: 'log-stream',
}

// Taken from AWS Documentation here
// https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-request
export const requestEvent: CloudFrontRequestEvent = {
  Records: [
    {
      cf: {
        config: {
          distributionDomainName: 'd123.cloudfront.net',
          distributionId: 'EDFDVBD6EXAMPLE',
          eventType: 'viewer-request',
          requestId: 'MRVMF7KydIvxMWfJIglgwHQwZsbG2IhRJ07sn9AkKUFSHS9EXAMPLE==',
        },
        request: {
          clientIp: '2001:0db8:85a3:0:0:8a2e:0370:7334',
          querystring: 'size=large',
          uri: '/picture.jpg',
          method: 'GET',
          headers: {
            host: [
              {
                key: 'Host',
                value: 'd111111abcdef8.cloudfront.net',
              },
            ],
            'user-agent': [
              {
                key: 'User-Agent',
                value: 'curl/7.51.0',
              },
            ],
          },
          origin: {
            s3: {
              authMethod: 'origin-access-identity',
              customHeaders: {
                'my-origin-custom-header': [
                  {
                    key: 'My-Origin-Custom-Header',
                    value: 'Test',
                  },
                ],
              },
              domainName: 'my-bucket.s3.amazonaws.com',
              path: '/s3_path',
              region: 'us-east-1',
            },
          },
        },
      },
    },
  ],
}
