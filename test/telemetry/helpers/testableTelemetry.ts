import { InMemorySpanExporter, ReadableSpan } from '@opentelemetry/tracing'
import { TelemetryOptions } from '../../../lib/telemetry/telemetryOptions'

export class TestableTelemetry {
  options: TelemetryOptions
  spans: ReadableSpan[]

  public constructor() {
    const exporter = new InMemorySpanExporter()
    this.options = { exporter }
    this.spans = exporter.getFinishedSpans()
  }
}
