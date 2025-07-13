import { ExecutionContext, ExecutionMeta, ExecutionStep, VariableValue } from '@/types/execution'

/**
 * Configuration for step creation
 */
export interface StepConfig {
  deduplicateSteps?: boolean
  maxSteps?: number
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<StepConfig> = {
  deduplicateSteps: true,
  maxSteps: 1000,
}

/**
 * Factory function that creates a step pusher with configuration
 */
export function createStepPusher(
  code: string,
  steps: ExecutionStep[],
  variables: ExecutionContext,
  config: StepConfig = {},
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  return (line: number | undefined, meta?: ExecutionMeta): void => {
    if (line === undefined || line < 1) {
      return
    }

    // Prevent infinite execution
    if (steps.length >= finalConfig.maxSteps) {
      console.warn(`Maximum step limit (${finalConfig.maxSteps}) reached`)
      return
    }

    const currentCode = getCodeLine(code, line)
    const variableSnapshot = cloneVariables(variables)

    // Sanitize variables before storing
    Object.keys(variableSnapshot).forEach((key) => {
      variableSnapshot[key] = sanitizeVariable(variableSnapshot[key]) as VariableValue
    })

    // Check for deduplication
    if (finalConfig.deduplicateSteps) {
      const lastStep = steps[steps.length - 1]
      if (shouldSkipStep(lastStep, line, variableSnapshot)) {
        return
      }
    }

    const step: ExecutionStep = {
      line,
      code: currentCode.trim(),
      variables: variableSnapshot,
      ...meta,
    }

    steps.push(step)
  }
}

/**
 * Determine if a step should be skipped based on deduplication rules
 */
function shouldSkipStep(
  lastStep: ExecutionStep | undefined,
  currentLine: number,
  currentVariables: ExecutionContext,
): boolean {
  if (!lastStep) {
    return false
  }

  return lastStep.line === currentLine && areVariablesEqual(lastStep.variables, currentVariables)
}

/**
 * Deep comparison of variable states
 */
function areVariablesEqual(vars1: ExecutionContext, vars2: ExecutionContext): boolean {
  try {
    return JSON.stringify(vars1) === JSON.stringify(vars2)
  } catch {
    const keys1 = Object.keys(vars1)
    const keys2 = Object.keys(vars2)

    if (keys1.length !== keys2.length) {
      return false
    }

    return keys1.every((key) => vars1[key] === vars2[key])
  }
}

/**
 * Creates a deep clone of the current variable state with better error handling
 */
function cloneVariables(variables: ExecutionContext): ExecutionContext {
  try {
    return JSON.parse(JSON.stringify(variables))
  } catch (error) {
    console.warn('Failed to clone variables, falling back to shallow copy:', error)
    return { ...variables }
  }
}

/**
 * Utility to validate and sanitize variable values before storing - NOW USED!
 */
function sanitizeVariable(value: unknown): unknown {
  if (typeof value === 'function') {
    return '[Function]'
  }

  if (typeof value === 'object' && value !== null) {
    try {
      JSON.stringify(value)
      return value
    } catch {
      return '[Circular]'
    }
  }

  // Handle extremely large strings
  if (typeof value === 'string' && value.length > 10000) {
    return value.substring(0, 10000) + '... [truncated]'
  }

  return value
}

/**
 * Get a specific line from code with bounds checking - NOW USED!
 */
function getCodeLine(code: string, lineNumber: number): string {
  const lines = code.split('\n')
  const index = lineNumber - 1

  if (index < 0 || index >= lines.length) {
    return ''
  }

  return lines[index]
}
