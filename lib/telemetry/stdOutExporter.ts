import { SpanExporter, ReadableSpan } from '@opentelemetry/tracing'
import { Writable } from 'stream'
import { ExportResult } from '@opentelemetry/base'
import { WritableSpan } from './writableSpan'

function noop(): void {
  /* no op */
}

function filterBrokenPipe(err, stream): void {
  // TODO verify on Windows
  if (err.code === 'EPIPE') {
    // when copying from sonic boom, they talk about stopping logging.
    // I don't understand the full context. It may be that we can
    // simplify what's happening here. Leaving original comment for
    // posterity
    /* If we get EPIPE, we should stop logging here
     however we have no control to the consumer of
     SonicBoom, so we just overwrite the write method */
    stream.write = noop
    stream.end = noop
    stream.flushSync = noop
    stream.destroy = noop
    return
  }
  stream.removeListener('error', filterBrokenPipe)
  stream.emit('error', err)
}

function protectWritableFromBrokenPipe(stream: Writable): Writable {
  stream.on('error', filterBrokenPipe)
  return stream
}

export class StdOutExporter implements SpanExporter {
  private out: Writable

  public constructor(out?: Writable) {
    this.out = protectWritableFromBrokenPipe(out || process.stdout)
  }

  export(spans: ReadableSpan[], done: (result: ExportResult) => void): void {
    return this.sendSpans(spans, done)
  }

  shutdown(): void {
    return this.sendSpans([])
  }

  private writable(span: ReadableSpan): string {
    return WritableSpan.from(span).stringify()
  }

  private sendSpans(
    spans: ReadableSpan[],
    done?: (result: ExportResult) => void
  ): void {
    for (const span of spans) {
      this.out.write(this.writable(span))
      this.out.write('\n')
    }
    if (done) {
      return done(ExportResult.SUCCESS)
    }
  }
}
