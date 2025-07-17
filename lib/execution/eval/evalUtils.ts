import { ExecutionContext, ExecutionMeta } from '@/types/execution';
import * as t from '@babel/types';
import { Node } from '@babel/types';

/**
 * Control flow result types for proper flow control
 */
export type ControlFlowResult =
  | { type: 'normal' }
  | { type: 'break'; label?: string }
  | { type: 'continue'; label?: string }
  | { type: 'return'; value?: unknown }

/**
 * Function definition storage
 */
export interface FunctionDefinition {
  name: string
  params: string[]
  body: t.BlockStatement
  node: t.FunctionDeclaration
}

/**
 * Call stack frame for function execution tracking
 */
export interface CallStackFrame {
  functionName: string
  parameters: Record<string, unknown>
  localVariables: ExecutionContext
  returnValue?: unknown
  line?: number
}

/**
 * Enhanced execution context with control flow state
 */
export interface EnhancedExecutionContext extends ExecutionContext {
  __controlFlow?: ControlFlowResult
  __loopDepth?: number
  __functionDepth?: number
}

/**
 * Function-related metadata stored separately from variables
 */
interface FunctionMetadata {
  functions: Map<string, FunctionDefinition>
  callStack: CallStackFrame[]
  currentScope?: ExecutionContext
}

/**
 * Configuration for control flow operations
 */
interface ControlFlowConfig {
  maxIterations: number
  maxLoopDepth: number
  timeoutMs: number
  enableBreakContinue: boolean
  enableReturn: boolean
}

const DEFAULT_CONTROL_FLOW_CONFIG: ControlFlowConfig = {
  maxIterations: 1000,
  maxLoopDepth: 10,
  timeoutMs: 5000,
  enableBreakContinue: true,
  enableReturn: true,
}

/**
 * Step pusher function type
 */
export type PushStepFn = (line?: number, meta?: ExecutionMeta) => void

/**
 * Loop execution context
 */
interface LoopContext {
  type: 'for' | 'while' | 'do-while'
  iterationCount: number
  startTime: number
  config: ControlFlowConfig
}

/**
 * Utility to check if control flow should interrupt execution
 */
export function shouldInterruptExecution(context: EnhancedExecutionContext): boolean {
  const controlFlow = context.__controlFlow
  return controlFlow !== undefined && controlFlow.type !== 'normal'
}

/**
 * Utility to reset control flow state
 */
export function resetControlFlow(context: EnhancedExecutionContext): void {
  context.__controlFlow = { type: 'normal' }

  // Initialize function metadata if not present
  if (!(context as any).__functionMetadata) {
    (context as any).__functionMetadata = {
      functions: new Map<string, FunctionDefinition>(),
      callStack: [],
      currentScope: context
    } as FunctionMetadata
  }
}

/**
 * Utility to set control flow state
 */
export function setControlFlow(context: EnhancedExecutionContext, result: ControlFlowResult): void {
  context.__controlFlow = result
}

/**
 * Utility to get current loop depth
 */
function getCurrentLoopDepth(context: EnhancedExecutionContext): number {
  return context.__loopDepth || 0
}

/**
 * Utility to increment loop depth
 */
export function incrementLoopDepth(context: EnhancedExecutionContext): void {
  context.__loopDepth = (context.__loopDepth || 0) + 1
}

/**
 * Utility to decrement loop depth
 */
export function decrementLoopDepth(context: EnhancedExecutionContext): void {
  context.__loopDepth = Math.max(0, (context.__loopDepth || 0) - 1)
}

/**
 * Check if we're inside a loop - NOW PROPERLY USED!
 */
export function isInsideLoop(context: EnhancedExecutionContext): boolean {
  return getCurrentLoopDepth(context) > 0
}

/**
 * Check if we're inside a function - NOW PROPERLY USED!
 */
export function isInsideFunction(context: EnhancedExecutionContext): boolean {
  return (context.__functionDepth || 0) > 0
}

/**
 * Increment function depth
 */
export function incrementFunctionDepth(context: EnhancedExecutionContext): void {
  context.__functionDepth = (context.__functionDepth || 0) + 1
}

/**
 * Decrement function depth
 */
export function decrementFunctionDepth(context: EnhancedExecutionContext): void {
  context.__functionDepth = Math.max(0, (context.__functionDepth || 0) - 1)
}

/**
 * Register a function definition
 */
export function registerFunction(
  context: EnhancedExecutionContext,
  functionDef: FunctionDefinition,
): void {
  const metadata = (context as any).__functionMetadata as FunctionMetadata
  if (!metadata) {
    resetControlFlow(context)
  }
  const finalMetadata = (context as any).__functionMetadata as FunctionMetadata
  finalMetadata.functions.set(functionDef.name, functionDef)
}

/**
 * Get a function definition by name
 */
export function getFunction(
  context: EnhancedExecutionContext,
  name: string,
): FunctionDefinition | undefined {
  const metadata = (context as any).__functionMetadata as FunctionMetadata
  return metadata?.functions.get(name)
}

/**
 * Push a new call stack frame
 */
export function pushCallStackFrame(
  context: EnhancedExecutionContext,
  frame: CallStackFrame,
): void {
  const metadata = (context as any).__functionMetadata as FunctionMetadata
  if (!metadata) {
    resetControlFlow(context)
  }
  const finalMetadata = (context as any).__functionMetadata as FunctionMetadata
  finalMetadata.callStack.push(frame)
}

/**
 * Pop the current call stack frame
 */
export function popCallStackFrame(context: EnhancedExecutionContext): CallStackFrame | undefined {
  const metadata = (context as any).__functionMetadata as FunctionMetadata
  return metadata?.callStack.pop()
}

/**
 * Get current call stack depth
 */
export function getCallStackDepth(context: EnhancedExecutionContext): number {
  const metadata = (context as any).__functionMetadata as FunctionMetadata
  return metadata?.callStack.length || 0
}

/**
 * Create a new scope for function execution
 */
export function createFunctionScope(
  context: EnhancedExecutionContext,
  parameters: Record<string, unknown>,
): ExecutionContext {
  // Create new scope with only parameters (properly typed)
  const newScope: ExecutionContext = {}

  // Add parameters with proper type conversion
  Object.keys(parameters).forEach(key => {
    const value = parameters[key]
    // Convert unknown to VariableValue
    if (value === null || value === undefined) {
      newScope[key] = value
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      newScope[key] = value
    } else if (Array.isArray(value)) {
      newScope[key] = value as unknown[]
    } else if (typeof value === 'object') {
      newScope[key] = value as Record<string, unknown>
    } else {
      // Fallback for other types
      newScope[key] = String(value)
    }
  })

  // Preserve control flow properties
  if (context.__controlFlow) {
    (newScope as EnhancedExecutionContext).__controlFlow = context.__controlFlow
  }
  if (context.__loopDepth !== undefined) {
    (newScope as EnhancedExecutionContext).__loopDepth = context.__loopDepth
  }
  if (context.__functionDepth !== undefined) {
    (newScope as EnhancedExecutionContext).__functionDepth = context.__functionDepth
  }

  // Copy function metadata reference
  const metadata = (context as any).__functionMetadata
  if (metadata) {
    (newScope as any).__functionMetadata = metadata
  }

  return newScope
}

/**
 * Restore previous scope after function execution
 */
export function restoreScope(
  context: EnhancedExecutionContext,
  previousScope: ExecutionContext,
): void {
  // Restore all properties from previous scope except function-related ones
  Object.keys(context).forEach(key => {
    if (!key.startsWith('__')) {
      delete context[key]
    }
  })

  Object.keys(previousScope).forEach(key => {
    if (!key.startsWith('__')) {
      context[key] = previousScope[key]
    }
  })
}

/**
 * Safely extract line number from AST node
 */
export function getNodeLine(node: Node | null): number | undefined {
  return node?.loc?.start.line
}

/**
 * Create loop context with safety checks
 */
export function createLoopContext(
  type: LoopContext['type'],
  config: Partial<ControlFlowConfig> = {},
): LoopContext {
  return {
    type,
    iterationCount: 0,
    startTime: Date.now(),
    config: { ...DEFAULT_CONTROL_FLOW_CONFIG, ...config },
  }
}

/**
 * Check if loop should continue based on safety constraints
 */
export function shouldContinueLoop(
  loopContext: LoopContext,
  context: EnhancedExecutionContext,
): boolean {
  // Check for control flow interruption
  if (shouldInterruptExecution(context)) {
    return false
  }

  // Check iteration limit
  if (loopContext.iterationCount >= loopContext.config.maxIterations) {
    console.warn(
      `Loop terminated: exceeded maximum iterations (${loopContext.config.maxIterations})`,
    )
    return false
  }

  // Check timeout
  if (Date.now() - loopContext.startTime > loopContext.config.timeoutMs) {
    console.warn(`Loop terminated: exceeded timeout (${loopContext.config.timeoutMs}ms)`)
    return false
  }

  // Check loop depth
  if (getCurrentLoopDepth(context) > loopContext.config.maxLoopDepth) {
    console.warn(`Loop terminated: exceeded maximum depth (${loopContext.config.maxLoopDepth})`)
    return false
  }

  return true
}
