import { InMemorySpanExporter, ReadableSpan } from '@opentelemetry/tracing'

export class TestableTelemetry {
  exporter: InMemorySpanExporter
  spans: ReadableSpan[]

  public constructor() {
    this.exporter = new InMemorySpanExporter()
    this.spans = this.exporter.getFinishedSpans()
  }
}
