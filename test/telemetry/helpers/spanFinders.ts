import { ReadableSpan } from '@opentelemetry/tracing'
import { TimedEvent } from '@opentelemetry/types'

export function spanWithName(
  spans: ReadableSpan[],
  name: string
): ReadableSpan {
  return spans.find(y => y.name === name)
}

function getEventWithName(name: string, span: ReadableSpan): TimedEvent {
  return span.events.find(y => y.name === name)
}

export function findSpanWithEventMatchingName(
  spans: ReadableSpan[],
  eventName: string
): ReadableSpan {
  return spans.find(x => getEventWithName(eventName, x))
}
