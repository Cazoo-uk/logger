import { Span, Tracer, Attributes } from '@opentelemetry/types'

export class Trace {
  private readonly tracer: Tracer
  private children: Trace[]
  private span: Span
  private context: Attributes
  private ended: boolean

  public constructor(tracer: Tracer, span: Span) {
    this.span = span
    this.tracer = tracer
    this.children = []
    this.ended = false
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
    if (!this.ended) this.span.end()
    this.ended = true
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
    this.span.addEvent(description, additionalData as Attributes)
  }
}
