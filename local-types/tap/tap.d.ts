declare let tap: Tap

declare interface Tap extends Test {
  Test: TestConstructor
  mocha: Mocha
  mochaGlobals: () => void
}

declare class Test {
  public constructor(options?: Options.Test)
  public tearDown(fn: (a: any) => any): void
  public setTimeout(n: number): void
  public endAll(): void
  public threw(er: Error, extra?: Error, proxy?: Test): void
  public pragma(set: Options.Pragma): void
  public plan(n: number, comment?: string): void
  public test(
    name: string,
    extra?: Options.Test,
    cb?: (t: Test) => Promise | void
  ): Promise
  public test(name: string, cb?: (t: Test) => Promise | void): Promise
  public current(): Test
  public stdin(name: string, extra?: Options.Bag): Promise
  public spawn(
    cmd: string,
    args: string,
    options?: Options.Bag,
    name?: string,
    extra?: Options.Spawn
  ): Promise
  public done(): void
  public passing(): boolean
  public pass(message?: string, extra?: Options.Assert): boolean
  public fail(message?: string, extra?: Options.Assert): boolean
  public addAssert(
    name: string,
    length: number,
    fn: (...args: any[]) => boolean
  ): boolean
  public comment(message: string, ...args: any[]): void
  public bailout(message?: string): void
  public beforeEach(fn: (cb: () => any) => Promise | void): void
  public afterEach(fn: (cb: () => any) => Promise | void): void

  // Assertions
  public ok: Assertions.Basic
  public true: Assertions.Basic
  public assert: Assertions.Basic

  public notOk: Assertions.Basic
  public false: Assertions.Basic
  public assertNot: Assertions.Basic

  public error: Assertions.Basic
  public ifErr: Assertions.Basic
  public ifError: Assertions.Basic

  public throws: Assertions.Throws
  public throw: Assertions.Throws

  public doesNotThrow: Assertions.DoesNotThrow
  public notThrow: Assertions.DoesNotThrow

  public equal: Assertions.Equal
  public equals: Assertions.Equal
  public isEqual: Assertions.Equal
  public is: Assertions.Equal
  public strictEqual: Assertions.Equal
  public strictEquals: Assertions.Equal
  public strictIs: Assertions.Equal
  public isStrict: Assertions.Equal
  public isStrictly: Assertions.Equal

  public notEqual: Assertions.NotEqual
  public notEquals: Assertions.NotEqual
  public inequal: Assertions.NotEqual
  public notStrictEqual: Assertions.NotEqual
  public notStrictEquals: Assertions.NotEqual
  public isNotEqual: Assertions.NotEqual
  public isNot: Assertions.NotEqual
  public doesNotEqual: Assertions.NotEqual
  public isInequal: Assertions.NotEqual

  public same: Assertions.Equal
  public equivalent: Assertions.Equal
  public looseEqual: Assertions.Equal
  public looseEquals: Assertions.Equal
  public deepEqual: Assertions.Equal
  public deepEquals: Assertions.Equal
  public isLoose: Assertions.Equal
  public looseIs: Assertions.Equal

  public notSame: Assertions.NotEqual
  public inequivalent: Assertions.NotEqual
  public looseInequal: Assertions.NotEqual
  public notDeep: Assertions.NotEqual
  public deepInequal: Assertions.NotEqual
  public notLoose: Assertions.NotEqual
  public looseNot: Assertions.NotEqual

  public strictSame: Assertions.Equal
  public strictEquivalent: Assertions.Equal
  public strictDeepEqual: Assertions.Equal
  public sameStrict: Assertions.Equal
  public deepIs: Assertions.Equal
  public isDeeply: Assertions.Equal
  public isDeep: Assertions.Equal
  public strictDeepEquals: Assertions.Equal

  public strictNotSame: Assertions.NotEqual
  public strictInequivalent: Assertions.NotEqual
  public strictDeepInequal: Assertions.NotEqual
  public notSameStrict: Assertions.NotEqual
  public deepNot: Assertions.NotEqual
  public notDeeply: Assertions.NotEqual
  public strictDeepInequals: Assertions.NotEqual
  public notStrictSame: Assertions.NotEqual

  public match: Assertions.Match
  public has: Assertions.Match
  public hasFields: Assertions.Match
  public matches: Assertions.Match
  public similar: Assertions.Match
  public like: Assertions.Match
  public isLike: Assertions.Match
  public includes: Assertions.Match
  public include: Assertions.Match
  public contains: Assertions.Match

  public notMatch: Assertions.Match
  public dissimilar: Assertions.Match
  public unsimilar: Assertions.Match
  public notSimilar: Assertions.Match
  public unlike: Assertions.Match
  public isUnlike: Assertions.Match
  public notLike: Assertions.Match
  public isNotLike: Assertions.Match
  public doesNotHave: Assertions.Match
  public isNotSimilar: Assertions.Match
  public isDissimilar: Assertions.Match

  public type: Assertions.Type
  public isa: Assertions.Type
  public isA: Assertions.Type
}

declare namespace Options {
  export interface Bag {
    [propName: string]: any
  }

  export interface Pragma {
    [propName: string]: boolean
  }

  export interface Assert extends Bag {
    todo?: boolean | string
    skip?: boolean | string
  }

  export interface Spawn extends Assert {
    bail?: boolean
    timeout?: number
  }

  export interface Test extends Assert {
    name?: string
    timeout?: number
    bail?: boolean
    autoend?: boolean
  }
}

declare namespace Assertions {
  export type Basic = (
    obj: any,
    message?: string,
    extra?: Options.Assert
  ) => boolean

  export type Throws = (
    fn?: (a: any) => any,
    expectedError?: Error,
    message?: string,
    extra?: Options.Assert
  ) => boolean

  export type DoesNotThrow = (
    fn?: (a: any) => any,
    message?: string,
    extra?: Options.Assert
  ) => boolean

  export type Equal = (
    found: any,
    wanted: any,
    message?: string,
    extra?: Options.Assert
  ) => boolean

  export type NotEqual = (
    found: any,
    notWanted: any,
    message?: string,
    extra?: Options.Assert
  ) => boolean

  export type Match = (
    found: any,
    pattern: any,
    message?: string,
    extra?: Options.Assert
  ) => boolean

  export type Type = (
    found: any,
    type: string | ((a: any) => any),
    message?: string,
    extra?: Options.Assert
  ) => boolean
}

// Super minimal description of returned Promise (which are really Bluebird promises)
declare interface Promise {
  [propName: string]: any
  then(fn: (t: Test) => any): Promise
  catch(fn: (err: Error) => any): Promise
}

declare interface Mocha {
  it: (name?: string, fn?: (a: any) => any) => void
  describe: (name?: string, fn?: (a: any) => any) => void
  global: () => void
}

// Little hack to simulate the Test class on the tap export
declare interface TestConstructor {
  new (options?: Options.Test): Test
  prototype: Test
}

export = tap
