import { ExecutionContext, ExecutionMeta } from '@/types/execution'
import { Node } from '@babel/types'

/**
 * Control flow result types for proper flow control
 */
export type ControlFlowResult =
  | { type: 'normal' }
  | { type: 'break'; label?: string }
  | { type: 'continue'; label?: string }
  | { type: 'return'; value?: unknown }

/**
 * Enhanced execution context with control flow state
 */
export interface EnhancedExecutionContext extends ExecutionContext {
  __controlFlow?: ControlFlowResult
  __loopDepth?: number
  __functionDepth?: number
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
