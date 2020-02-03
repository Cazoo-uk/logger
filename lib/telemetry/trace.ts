import { Span, Tracer, Attributes } from '@opentelemetry/types'

export class Trace {
  private readonly span: Span
  private readonly tracer: Tracer
  private context: Attributes

  public constructor(tracer: Tracer, span?: Span) {
    this.span = span
    this.tracer = tracer
  }

  private makeChild(description: string): Trace {
    const childTrace = new Trace(
      this.tracer,
      this.tracer.startSpan(description, {
        parent: this.span,
        attributes: { context: this.context },
      })
    )
    childTrace.appendContext(this.context)
    return childTrace
  }

  private handleError(childTrace: Trace, e: unknown): void {
    childTrace.addInfo('error', e as Attributes)
    childTrace.span.end()
    throw e
  }

  end(): void {
    this.span.end()
  }

  appendContext(context: unknown): Trace {
    this.context = {
      ...this.context,
      ...(context as Attributes),
    }
    if (this.span) {
      this.span.setAttributes({ context: this.context })
    }
    return this
  }

  for<T>(description: string, fn: (trace: Trace) => T): T {
    const child = this.makeChild(description)
    try {
      const result: T = fn(child)
      child.end()
      return result
    } catch (e) {
      this.handleError(child, e)
    }
  }

  async async<T>(
    description: string,
    fn: (trace: Trace) => Promise<T>
  ): Promise<T> {
    const child = this.makeChild(description)
    try {
      const result: T = await fn(child)
      child.end()
      return result
    } catch (e) {
      this.handleError(child, e)
    }
  }

  addInfo(description: string, additionalData?: unknown): void {
    if (this.span) {
      this.span.addEvent(description, additionalData as Attributes)
      return
    }
    console.warn(
      'Attempting to add a trace to the root trace.\n\
You have probably forgotten to pass through the child trace\n\
Try something like `trace.for("some trace name", trace => {trace.addInfo(...)};...)`'
    )
  }
}
