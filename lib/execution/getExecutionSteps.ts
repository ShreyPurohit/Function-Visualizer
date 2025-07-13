import { ExecutionContext, ExecutionError, ExecutionMeta, ExecutionStep } from '@/types/execution'
import { parse, ParserOptions } from '@babel/parser'
import traverse, { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { applyExpr, evalExpr } from './helpers/evalExpr'
import { createStepPusher, StepConfig } from './helpers/step'
import { simulateFor, simulateIf, simulateWhile } from './simulators/controlFlow'

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

    // Initialize execution context with safe environment if enabled
    const steps: ExecutionStep[] = []
    const variables: ExecutionContext = {}

    if (finalConfig.safeMode) {
      setupSafeExecutionEnvironment(variables)
    }

    const pushStep = createStepPusher(trimmedCode, steps, variables, finalConfig)

    // Traverse and execute
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
 * Execute the AST with proper error handling and context management
 */
function executeAST(
  ast: t.File,
  variables: ExecutionContext,
  pushStep: ReturnType<typeof createStepPusher>,
): void {
  traverse(ast, {
    enter(path: NodePath) {
      try {
        executeNode(path, variables, pushStep)
      } catch (error) {
        const line = path.node.loc?.start.line
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        console.warn(`Error executing node at line ${line}:`, errorMessage)

        pushStep(line, {
          output: `Error: ${errorMessage}`,
        })

        path.skip()
      }
    },
  })
}

/**
 * Execute individual AST nodes
 */
function executeNode(
  path: NodePath,
  variables: ExecutionContext,
  pushStep: ReturnType<typeof createStepPusher>,
): void {
  const node = path.node

  if (shouldSkipNode(node, path)) {
    return
  }

  if (t.isVariableDeclaration(node)) {
    handleVariableDeclaration(node, variables, pushStep)
  } else if (t.isExpressionStatement(node)) {
    handleExpressionStatement(node, variables, pushStep)
  } else if (t.isForStatement(node)) {
    simulateFor(node, variables, pushStep)
    path.skip()
  } else if (t.isWhileStatement(node)) {
    simulateWhile(node, variables, pushStep)
    path.skip()
  } else if (t.isIfStatement(node)) {
    simulateIf(node, variables, pushStep)
    path.skip()
  } else if (t.isFunctionDeclaration(node)) {
    handleFunctionDeclaration(node, variables, pushStep)
  }
}

/**
 * Determine if a node should be skipped during execution
 */
function shouldSkipNode(node: t.Node, path: NodePath): boolean {
  const parent = path.parent

  if (
    t.isForStatement(parent) ||
    t.isWhileStatement(parent) ||
    t.isIfStatement(parent) ||
    (t.isBlockStatement(parent) &&
      (t.isForStatement(path.parentPath?.parent) ||
        t.isWhileStatement(path.parentPath?.parent) ||
        t.isIfStatement(path.parentPath?.parent)))
  ) {
    return true
  }

  if (
    t.isTSTypeAnnotation(node) ||
    t.isTSTypeReference(node) ||
    t.isTSInterfaceDeclaration(node) ||
    t.isTSTypeAliasDeclaration(node)
  ) {
    return true
  }

  return false
}

/**
 * Handle variable declarations
 */
function handleVariableDeclaration(
  node: t.VariableDeclaration,
  variables: ExecutionContext,
  pushStep: ReturnType<typeof createStepPusher>,
): void {
  node.declarations.forEach((declarator) => {
    if (t.isIdentifier(declarator.id)) {
      const value = evalExpr(declarator.init, variables)
      variables[declarator.id.name] = value
    }
  })

  pushStep(node.loc?.start.line)
}

/**
 * Handle expression statements
 */
function handleExpressionStatement(
  node: t.ExpressionStatement,
  variables: ExecutionContext,
  pushStep: ReturnType<typeof createStepPusher>,
): void {
  const line = node.loc?.start.line
  const meta: ExecutionMeta = {}

  applyExpr(node.expression, variables, meta)
  pushStep(line, meta)
}

/**
 * Handle function declarations
 */
function handleFunctionDeclaration(
  node: t.FunctionDeclaration,
  variables: ExecutionContext,
  pushStep: ReturnType<typeof createStepPusher>,
): void {
  if (node.id && t.isIdentifier(node.id)) {
    variables[node.id.name] = `[Function: ${node.id.name}]`
    pushStep(node.loc?.start.line, {
      output: `Function '${node.id.name}' declared`,
    })
  }
}

/**
 * Utility function to validate execution steps - NOW USED!
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
 * Setup safe execution environment - NOW USED!
 */
function setupSafeExecutionEnvironment(variables: ExecutionContext): void {
  // Add safe built-in objects and methods
  variables.__SAFE_MODE__ = true
  variables.__MAX_EXECUTION_TIME__ = 5000
  variables.__MAX_STEPS__ = 1000
  variables.__MAX_VARIABLES__ = 100
  variables.__MAX_STRING_LENGTH__ = 10000
}
