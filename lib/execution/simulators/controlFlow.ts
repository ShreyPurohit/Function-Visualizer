import { BlockContext, ExecutionContext, ExecutionMeta } from '@/types/execution'
import * as t from '@babel/types'
import { applyExpr, evalExpr } from '../helpers/evalExpr'

/**
 * Configuration for control flow simulation
 */
interface ControlFlowConfig {
  maxIterations: number
  timeoutMs?: number
}

const DEFAULT_CONFIG: ControlFlowConfig = {
  maxIterations: 200,
  timeoutMs: 5000, // 5 seconds timeout
}

type PushStepFn = (line?: number, meta?: ExecutionMeta) => void

/**
 * Enhanced for loop simulation with better error handling and configuration
 */
export function simulateFor(
  node: t.ForStatement,
  variables: ExecutionContext,
  pushStep: PushStepFn,
  config: Partial<ControlFlowConfig> = {},
): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const { start, end } = getNodeLineRange(node)

  const meta: ExecutionMeta = {
    blockType: BlockContext.FOR,
    blockRange: { start, end },
  }

  try {
    // Initialize the loop
    if (node.init) {
      applyExpr(node.init, variables)
      pushStep(getNodeStartLine(node.init), meta)
    }

    let iterationCount = 0
    const startTime = Date.now()

    // Loop execution with guards - Fix: Handle undefined test expression
    while (
      shouldContinueLoop(node.test || null, variables, iterationCount, finalConfig, startTime)
    ) {
      // Execute loop body
      if (node.body) {
        executeStatement(node.body, variables, pushStep, meta)
      }

      // Execute update expression
      if (node.update) {
        applyExpr(node.update, variables)
        pushStep(getNodeStartLine(node.update), meta)
      }

      iterationCount++
    }

    // Final step for loop completion
    pushStep(start, {
      ...meta,
      output: `Loop completed after ${iterationCount} iterations`,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    pushStep(start, {
      ...meta,
      output: `Error in for loop: ${errorMessage}`,
    })
  }
}

/**
 * Enhanced while loop simulation
 */
export function simulateWhile(
  node: t.WhileStatement,
  variables: ExecutionContext,
  pushStep: PushStepFn,
  config: Partial<ControlFlowConfig> = {},
): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const { start, end } = getNodeLineRange(node)

  const meta: ExecutionMeta = {
    blockType: BlockContext.WHILE,
    blockRange: { start, end },
  }

  try {
    let iterationCount = 0
    const startTime = Date.now()

    // Check initial condition
    pushStep(start, meta)

    while (shouldContinueLoop(node.test, variables, iterationCount, finalConfig, startTime)) {
      // Execute loop body
      if (node.body) {
        executeStatement(node.body, variables, pushStep, meta)
      }

      // Re-evaluate condition
      pushStep(start, meta)
      iterationCount++
    }

    // Final step for loop completion
    pushStep(start, {
      ...meta,
      output: `While loop completed after ${iterationCount} iterations`,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    pushStep(start, {
      ...meta,
      output: `Error in while loop: ${errorMessage}`,
    })
  }
}

/**
 * Enhanced if statement simulation
 */
export function simulateIf(
  node: t.IfStatement,
  variables: ExecutionContext,
  pushStep: PushStepFn,
): void {
  const { start, end } = getNodeLineRange(node)

  try {
    // Evaluate condition
    const condition = evalExpr(node.test, variables)
    const conditionResult = Boolean(condition)

    // Determine which block to execute
    const selectedBlock = conditionResult ? node.consequent : node.alternate
    const blockType = conditionResult ? BlockContext.IF : BlockContext.ELSE

    const meta: ExecutionMeta = {
      blockType,
      blockRange: { start, end },
      output: `Condition evaluated to: ${conditionResult}`,
    }

    // Add step for condition evaluation
    pushStep(start, meta)

    // Execute the selected block
    if (selectedBlock) {
      executeStatement(selectedBlock, variables, pushStep, meta)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    pushStep(start, {
      blockType: BlockContext.IF,
      blockRange: { start, end },
      output: `Error in if statement: ${errorMessage}`,
    })
  }
}

/**
 * Helper function to determine if a loop should continue
 * Fix: Accept null as well as undefined for test expression
 */
function shouldContinueLoop(
  testExpression: t.Expression | null,
  variables: ExecutionContext,
  iterationCount: number,
  config: ControlFlowConfig,
  startTime: number,
): boolean {
  // Check iteration limit
  if (iterationCount >= config.maxIterations) {
    console.warn(`Loop terminated: exceeded maximum iterations (${config.maxIterations})`)
    return false
  }

  // Check timeout
  if (config.timeoutMs && Date.now() - startTime > config.timeoutMs) {
    console.warn(`Loop terminated: exceeded timeout (${config.timeoutMs}ms)`)
    return false
  }

  // Evaluate test condition
  if (!testExpression) {
    return false // No test means infinite loop, but we prevent that
  }

  try {
    return Boolean(evalExpr(testExpression, variables))
  } catch (error) {
    console.warn('Error evaluating loop condition:', error)
    return false
  }
}

/**
 * Execute a single statement with proper error handling
 */
function executeStatement(
  statement: t.Statement,
  variables: ExecutionContext,
  pushStep: PushStepFn,
  parentMeta?: ExecutionMeta,
): void {
  if (t.isBlockStatement(statement)) {
    // Execute all statements in the block
    statement.body.forEach((stmt) => {
      executeStatement(stmt, variables, pushStep, parentMeta)
    })
  } else if (t.isVariableDeclaration(statement)) {
    // Handle variable declarations
    statement.declarations.forEach((declarator) => {
      if (t.isIdentifier(declarator.id)) {
        variables[declarator.id.name] = evalExpr(declarator.init, variables)
      }
    })
    pushStep(getNodeStartLine(statement), parentMeta)
  } else if (t.isExpressionStatement(statement)) {
    // Handle expression statements
    const stepMeta = { ...parentMeta }
    applyExpr(statement.expression, variables, stepMeta)
    pushStep(getNodeStartLine(statement), stepMeta)
  } else if (t.isIfStatement(statement)) {
    // Nested if statements
    simulateIf(statement, variables, pushStep)
  } else if (t.isForStatement(statement)) {
    // Nested for loops
    simulateFor(statement, variables, pushStep)
  } else if (t.isWhileStatement(statement)) {
    // Nested while loops
    simulateWhile(statement, variables, pushStep)
  } else {
    // Handle other statement types or log unsupported ones
    pushStep(getNodeStartLine(statement), {
      ...parentMeta,
      output: `Unsupported statement type: ${statement.type}`,
    })
  }
}

/**
 * Safely extract line range from a node
 */
function getNodeLineRange(node: t.Node): { start: number; end: number } {
  const start = node.loc?.start.line ?? 1
  const end = node.loc?.end.line ?? start
  return { start, end }
}

/**
 * Safely extract start line from a node
 */
function getNodeStartLine(node: t.Node | null | undefined): number | undefined {
  return node?.loc?.start.line
}
