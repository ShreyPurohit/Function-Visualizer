// types/execution.ts

export enum BlockContext {
  FUNCTION = 'function',
  FOR = 'for',
  WHILE = 'while',
  IF = 'if',
  ELSE = 'else',
}

// Fix circular reference by using a union type instead of recursive type alias
export type VariableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>
  | unknown[]

export interface ExecutionContext {
  [key: string]: VariableValue
}

export interface ExecutionMeta {
  blockType?: BlockContext
  blockRange?: { start: number; end: number }
  output?: unknown
}

export interface ExecutionStep {
  line: number
  code: string
  variables: ExecutionContext
  blockType?: BlockContext
  blockRange?: { start: number; end: number }
  output?: unknown
}

export class ExecutionError extends Error {
  public readonly line?: number

  constructor(message: string, line?: number) {
    super(message)
    this.name = 'ExecutionError'
    this.line = line
  }
}
