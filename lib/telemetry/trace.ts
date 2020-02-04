import { Span, Tracer, Attributes } from '@opentelemetry/types'

export class Trace {
  private readonly tracer: Tracer
  private children: Trace[]
  private span: Span
  private context: Attributes

  public constructor(tracer: Tracer, span: Span) {
    this.span = span
    this.tracer = tracer
    this.children = []
  }

  makeChild(description: string): Trace {
    const childTrace = new Trace(
      this.tracer,
      this.tracer.startSpan(description, {
        parent: this.span,
        attributes: { context: this.context },
      })
    )
    childTrace.appendContext(this.context)
    this.children.push(childTrace)
    return childTrace
  }

  error(e: unknown): void {
    this.addInfo('error', e as Attributes)
    this.end()
  }

  end(): void {
    this.children.forEach(x => x.end())
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
