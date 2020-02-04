import { AnyEvent } from '../events/anyEvent'
import { TelemetryOptions } from './telemetryOptions'
import { StdOutExporter } from './stdOutExporter'
import { Context } from 'aws-lambda'
import { getContext } from './getContext'
import { Trace } from './trace'
import {
  BasicTracerRegistry,
  SimpleSpanProcessor,
} from '@opentelemetry/tracing'

export class Telemetry {
  private static makeTrace(options?: TelemetryOptions): Trace {
    const exporter = (options && options.exporter) || new StdOutExporter()
    const registry = new BasicTracerRegistry()
    registry.addSpanProcessor(new SimpleSpanProcessor(exporter))
    const tracer = registry.getTracer('cazoo', undefined, {})
    return new Trace(tracer, tracer.startSpan('root'))
  }

  public static new(options?: TelemetryOptions): Trace {
    return Telemetry.makeTrace(options)
  }

  public static fromContext(
    event?: AnyEvent,
    context?: Context,
    options?: TelemetryOptions
  ): Trace {
    return Telemetry.makeTrace(options).appendContext(
      getContext(event, context, options)
    )
  }
}
