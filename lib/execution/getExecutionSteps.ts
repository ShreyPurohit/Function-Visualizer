import { ExecutionError, ExecutionStep } from '@/types/execution'
import { parse, ParserOptions } from '@babel/parser'
import * as t from '@babel/types'
import { evalStmt } from './eval/evalStmt'
import { EnhancedExecutionContext, resetControlFlow } from './eval/evalUtils'
import { createStepPusher, StepConfig } from './step'

/**
 * Configuration for execution step generation
 */
interface ExecutionConfig extends StepConfig {
  parserOptions?: ParserOptions
  enableTypeScript?: boolean
  enableJSX?: boolean
  strictMode?: boolean
  enableValidation?: boolean
  safeMode?: boolean
}

/**
 * Default configuration for execution
 */
const DEFAULT_EXECUTION_CONFIG: Required<ExecutionConfig> = {
  deduplicateSteps: true,
  maxSteps: 1000,
  parserOptions: {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    allowImportExportEverywhere: false,
    allowReturnOutsideFunction: false,
    strictMode: false,
  },
  enableTypeScript: true,
  enableJSX: true,
  strictMode: false,
  enableValidation: true,
  safeMode: true,
}

/**
 * Main function to generate execution steps from code
 */
export function getExecutionSteps(
  code: string,
  config: Partial<ExecutionConfig> = {},
): ExecutionStep[] {
  const finalConfig = { ...DEFAULT_EXECUTION_CONFIG, ...config }

  // Validate input
  if (!code || typeof code !== 'string') {
    throw new ExecutionError('Invalid code input: code must be a non-empty string')
  }

  const trimmedCode = code.trim()
  if (!trimmedCode) {
    throw new ExecutionError('Code cannot be empty')
  }

  try {
    // Parse the code with enhanced error handling
    const ast = parseCodeSafely(trimmedCode, finalConfig)

    // Initialize execution context with enhanced control flow support
    const steps: ExecutionStep[] = []
    const variables: EnhancedExecutionContext = {
      __controlFlow: { type: 'normal' },
      __loopDepth: 0,
      __functionDepth: 0,
    }

    if (finalConfig.safeMode) {
      setupSafeExecutionEnvironment(variables)
    }

    const pushStep = createStepPusher(trimmedCode, steps, variables, finalConfig)

    // Execute AST with enhanced control flow
    executeAST(ast, variables, pushStep)

    // Validate results if enabled
    if (finalConfig.enableValidation && !validateExecutionSteps(steps)) {
      throw new ExecutionError('Generated execution steps failed validation')
    }

    if (steps.length === 0) {
      console.warn(
        'No execution steps generated. The code might not contain executable statements.',
      )
    }

    return steps
  } catch (error) {
    if (error instanceof ExecutionError) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown parsing error'
    throw new ExecutionError(`Failed to parse or execute code: ${message}`)
  }
}

/**
 * Parse code with enhanced error handling and configuration
 */
function parseCodeSafely(code: string, config: ExecutionConfig): t.File {
  try {
    return parse(code, config.parserOptions)
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error) {
      const parseError = error as {
        message: string
        loc?: { line?: number; column?: number }
      }
      const line =
        typeof parseError.loc === 'object' && typeof parseError.loc.line === 'number'
          ? parseError.loc.line
          : undefined
      const column =
        typeof parseError.loc === 'object' && typeof parseError.loc.column === 'number'
          ? parseError.loc.column
          : undefined

      let message = `Syntax error: ${parseError.message}`
      if (line !== undefined && column !== undefined) {
        message += ` at line ${line}, column ${column}`
      }

      throw new ExecutionError(message, line)
    }

    throw new ExecutionError('Failed to parse code: Unknown syntax error')
  }
}

/**
 * Execute the AST with enhanced control flow support
 */
function executeAST(
  ast: t.File,
  variables: EnhancedExecutionContext,
  pushStep: ReturnType<typeof createStepPusher>,
): void {
  // Reset control flow state
  resetControlFlow(variables)

  // Execute program body statements
  if (ast.program && ast.program.body) {
    for (const statement of ast.program.body) {
      try {
        const result = evalStmt(statement, variables, pushStep)

        // Handle top-level control flow (like return statements)
        if (result.type === 'return') {
          pushStep(statement.loc?.start.line, {
            output: 'Program terminated by return statement',
          })
          break
        }

        // Break and continue at top level are errors, but we'll handle gracefully
        if (result.type === 'break' || result.type === 'continue') {
          pushStep(statement.loc?.start.line, {
            output: `Error: ${result.type} statement outside of loop`,
          })
        }
      } catch (error) {
        const line = statement.loc?.start.line
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        console.warn(`Error executing statement at line ${line}:`, errorMessage)

        pushStep(line, {
          output: `Error: ${errorMessage}`,
        })

        // Continue with next statement instead of stopping
        continue
      }
    }
  }
}

/**
 * Utility function to validate execution steps
 */
function validateExecutionSteps(steps: ExecutionStep[]): boolean {
  if (!Array.isArray(steps)) {
    return false
  }

  return steps.every((step, index) => {
    if (typeof step.line !== 'number' || step.line < 1) {
      console.warn(`Invalid step at index ${index}: line must be a positive number`)
      return false
    }

    if (typeof step.code !== 'string') {
      console.warn(`Invalid step at index ${index}: code must be a string`)
      return false
    }

    if (!step.variables || typeof step.variables !== 'object') {
      console.warn(`Invalid step at index ${index}: variables must be an object`)
      return false
    }

    return true
  })
}

/**
 * Setup safe execution environment
 */
function setupSafeExecutionEnvironment(variables: EnhancedExecutionContext): void {
  // Add safe built-in objects and methods
  variables.__SAFE_MODE__ = true
  variables.__MAX_EXECUTION_TIME__ = 5000
  variables.__MAX_STEPS__ = 1000
  variables.__MAX_VARIABLES__ = 100
  variables.__MAX_STRING_LENGTH__ = 10000
}
