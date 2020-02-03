import { SpanExporter } from '@opentelemetry/tracing'
import { LoggerOptions } from '../index'

export interface TelemetryOptions extends LoggerOptions {
  exporter?: SpanExporter
}
