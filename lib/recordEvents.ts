import { ScheduledEvent } from 'aws-lambda'
import Pino from 'pino'
import { LoggerContext } from './shared/context'

const OUT = 'out'
const IN = 'in'

type Direction = 'IN' | 'OUT'

export function eventRecorder(stream: any) {
  function _write(
    context: LoggerContext,
    event: ScheduledEvent,
    dir: Direction
  ) {
    const ts = Date.now()
    stream.write(
        `CZEV {"ts": ${ts}, "req": "${context.request_id}", "event": {"type": "${event['detail-type']}", "id": "${event.id}"}, "node": {"name": "${context.function.name}", "svc": "${context.function.service}"}, "dir": "${dir}" }\n`)
  }
  return _write
}

export interface EventRecorder {
  stream: any
  recordEvent: (
    context: LoggerContext,
    event: ScheduledEvent,
    dir: Direction
  ) => void
}
