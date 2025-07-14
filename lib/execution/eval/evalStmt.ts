import { ExecutionMeta } from '@/types/execution'
import * as t from '@babel/types'
import { handleBreakStatement, handleContinueStatement, handleReturnStatement } from './evalControl'
import { applyExpr, evalExpr } from './evalExpr'
import { simulateDoWhile, simulateFor, simulateWhile } from './evalLoops'
import {
  ControlFlowResult,
  EnhancedExecutionContext,
  PushStepFn,
  getNodeLine,
  shouldInterruptExecution,
} from './evalUtils'

/**
 * Enhanced statement evaluator with proper control flow support
 */
export function evalStmt(
  stmt: t.Statement,
  context: EnhancedExecutionContext,
  pushStep: PushStepFn,
  meta?: ExecutionMeta,
): ControlFlowResult {
  // Check if execution should be interrupted
  if (shouldInterruptExecution(context)) {
    return context.__controlFlow!
  }

  try {
    // Handle different statement types
    if (t.isExpressionStatement(stmt)) {
      return handleExpressionStatement(stmt, context, pushStep, meta)
    }

    if (t.isVariableDeclaration(stmt)) {
      return handleVariableDeclaration(stmt, context, pushStep, meta)
    }

    if (t.isBreakStatement(stmt)) {
      return handleBreakStatement(stmt, context, pushStep)
    }

    if (t.isContinueStatement(stmt)) {
      return handleContinueStatement(stmt, context, pushStep)
    }

    if (t.isReturnStatement(stmt)) {
      return handleReturnStatement(stmt, context, pushStep)
    }

    if (t.isBlockStatement(stmt)) {
      return handleBlockStatement(stmt, context, pushStep, meta)
    }

    if (t.isIfStatement(stmt)) {
      return handleIfStatement(stmt, context, pushStep)
    }

    if (t.isForStatement(stmt)) {
      return simulateFor(stmt, context, pushStep)
    }

    if (t.isWhileStatement(stmt)) {
      return simulateWhile(stmt, context, pushStep)
    }

    if (t.isDoWhileStatement(stmt)) {
      return simulateDoWhile(stmt, context, pushStep)
    }

    // Handle empty statements (semicolons)
    if (t.isEmptyStatement(stmt)) {
      // Empty statements don't need to be processed or logged
      return { type: 'normal' }
    }

    // Handle other statement types
    console.warn(`Statement type not fully supported: ${stmt.type}`)
    pushStep(getNodeLine(stmt), {
      ...meta,
      output: `Unsupported statement: ${stmt.type}`,
    })

    return { type: 'normal' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const line = getNodeLine(stmt)

    pushStep(line, {
      ...meta,
      output: `Error executing statement: ${errorMessage}`,
    })

    return { type: 'normal' }
  }
}

/**
 * Handle expression statements
 */
function handleExpressionStatement(
  stmt: t.ExpressionStatement,
  context: EnhancedExecutionContext,
  pushStep: PushStepFn,
  meta?: ExecutionMeta,
): ControlFlowResult {
  const line = getNodeLine(stmt)
  const stepMeta = { ...meta }

  applyExpr(stmt.expression, context, stepMeta)
  pushStep(line, stepMeta)

  return { type: 'normal' }
}

/**
 * Handle variable declarations
 */
function handleVariableDeclaration(
  stmt: t.VariableDeclaration,
  context: EnhancedExecutionContext,
  pushStep: PushStepFn,
  meta?: ExecutionMeta,
): ControlFlowResult {
  const line = getNodeLine(stmt)

  applyExpr(stmt, context, meta)
  pushStep(line, meta)

  return { type: 'normal' }
}

/**
 * Handle block statements
 */
function handleBlockStatement(
  stmt: t.BlockStatement,
  context: EnhancedExecutionContext,
  pushStep: PushStepFn,
  meta?: ExecutionMeta,
): ControlFlowResult {
  for (const statement of stmt.body) {
    const result = evalStmt(statement, context, pushStep, meta)

    // If we hit a control flow statement, propagate it up
    if (result.type !== 'normal') {
      return result
    }

    // Check if control flow was set by a nested statement
    if (shouldInterruptExecution(context)) {
      return context.__controlFlow!
    }
  }

  return { type: 'normal' }
}

/**
 * Handle if statements with proper control flow support
 */
function handleIfStatement(
  stmt: t.IfStatement,
  context: EnhancedExecutionContext,
  pushStep: PushStepFn,
): ControlFlowResult {
  const line = getNodeLine(stmt)

  try {
    // Import evalExpr here to avoid circular dependency

    // Evaluate condition
    const condition = evalExpr(stmt.test, context)
    const conditionResult = Boolean(condition)

    pushStep(line, {
      output: `If condition evaluated to: ${conditionResult}`,
    })

    // Execute the appropriate branch
    if (conditionResult && stmt.consequent) {
      const result = evalStmt(stmt.consequent, context, pushStep)
      if (result.type !== 'normal') {
        return result
      }
    } else if (!conditionResult && stmt.alternate) {
      const result = evalStmt(stmt.alternate, context, pushStep)
      if (result.type !== 'normal') {
        return result
      }
    }

    return { type: 'normal' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    pushStep(line, {
      output: `Error in if statement: ${errorMessage}`,
    })
    return { type: 'normal' }
  }
}

/**
 * Execute multiple statements with control flow handling
 */
export function executeStatements(
  statements: t.Statement[],
  context: EnhancedExecutionContext,
  pushStep: PushStepFn,
  meta?: ExecutionMeta,
): ControlFlowResult {
  for (const stmt of statements) {
    const result = evalStmt(stmt, context, pushStep, meta)

    // Propagate control flow results
    if (result.type !== 'normal') {
      return result
    }

    // Check for control flow interruption
    if (shouldInterruptExecution(context)) {
      return context.__controlFlow!
    }
  }

  return { type: 'normal' }
}
