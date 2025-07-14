import { BlockContext, ExecutionMeta } from '@/types/execution'
import * as t from '@babel/types'
import { handleLoopControlFlow, resetLoopControlFlow, shouldContinueLoop } from './evalControl'
import { applyExpr, evalExpr } from './evalExpr'
import { evalStmt, executeStatements } from './evalStmt'
import {
  ControlFlowResult,
  EnhancedExecutionContext,
  PushStepFn,
  createLoopContext,
  decrementLoopDepth,
  getNodeLine,
  incrementLoopDepth,
  shouldContinueLoop as shouldContinueLoopSafety,
} from './evalUtils'

/**
 * Enhanced for loop simulation with proper control flow support
 */
export function simulateFor(
  node: t.ForStatement,
  context: EnhancedExecutionContext,
  pushStep: PushStepFn,
): ControlFlowResult {
  const startLine = getNodeLine(node)
  const endLine = node.loc?.end.line || startLine
  const loopContext = createLoopContext('for')

  const meta: ExecutionMeta = {
    blockType: BlockContext.FOR,
    blockRange: { start: startLine || 1, end: endLine || 1 },
  }

  try {
    // Increment loop depth for safety tracking
    incrementLoopDepth(context)

    // Initialize the loop
    if (node.init) {
      applyExpr(node.init, context)
      pushStep(getNodeLine(node.init), meta)
    }

    // Main loop execution
    while (shouldContinueLoopSafety(loopContext, context)) {
      // Evaluate loop condition
      if (node.test) {
        const conditionResult = Boolean(evalExpr(node.test, context))

        pushStep(getNodeLine(node.test), {
          ...meta,
          output: `Loop condition: ${conditionResult}`,
        })

        if (!conditionResult) {
          break
        }
      }

      // Execute loop body
      if (node.body) {
        executeLoopBody(node.body, context, pushStep, meta)

        // Use handleLoopControlFlow to properly handle control flow
        if (handleLoopControlFlow(context, pushStep)) {
          // Control flow indicates we should exit the loop
          break
        }
      }

      // Execute update expression (only if we didn't continue)
      if (node.update && !shouldContinueLoop(context)) {
        applyExpr(node.update, context)
        pushStep(getNodeLine(node.update), meta)
      }

      loopContext.iterationCount++
    }

    // Clean up any remaining control flow state
    resetLoopControlFlow(context)

    // Final step for loop completion
    pushStep(startLine, {
      ...meta,
      output: `For loop completed after ${loopContext.iterationCount} iterations`,
    })

    return { type: 'normal' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    pushStep(startLine, {
      ...meta,
      output: `Error in for loop: ${errorMessage}`,
    })
    return { type: 'normal' }
  } finally {
    decrementLoopDepth(context)
  }
}

/**
 * Enhanced while loop simulation with proper control flow support
 */
export function simulateWhile(
  node: t.WhileStatement,
  context: EnhancedExecutionContext,
  pushStep: PushStepFn,
): ControlFlowResult {
  const startLine = getNodeLine(node)
  const endLine = node.loc?.end.line || startLine
  const loopContext = createLoopContext('while')

  const meta: ExecutionMeta = {
    blockType: BlockContext.WHILE,
    blockRange: { start: startLine || 1, end: endLine || 1 },
  }

  try {
    // Increment loop depth for safety tracking
    incrementLoopDepth(context)

    // Main loop execution
    while (shouldContinueLoopSafety(loopContext, context)) {
      // Evaluate loop condition
      const conditionResult = Boolean(evalExpr(node.test, context))

      pushStep(startLine, {
        ...meta,
        output: `While condition: ${conditionResult}`,
      })

      if (!conditionResult) {
        break
      }

      // Execute loop body
      if (node.body) {
        executeLoopBody(node.body, context, pushStep, meta)

        // Use handleLoopControlFlow to properly handle control flow
        if (handleLoopControlFlow(context, pushStep)) {
          // Control flow indicates we should exit the loop
          break
        }
      }

      loopContext.iterationCount++
    }

    // Clean up any remaining control flow state
    resetLoopControlFlow(context)

    // Final step for loop completion
    pushStep(startLine, {
      ...meta,
      output: `While loop completed after ${loopContext.iterationCount} iterations`,
    })

    return { type: 'normal' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    pushStep(startLine, {
      ...meta,
      output: `Error in while loop: ${errorMessage}`,
    })
    return { type: 'normal' }
  } finally {
    decrementLoopDepth(context)
  }
}

/**
 * Simulate do-while loops with proper control flow support
 */
export function simulateDoWhile(
  node: t.DoWhileStatement,
  context: EnhancedExecutionContext,
  pushStep: PushStepFn,
): ControlFlowResult {
  const startLine = getNodeLine(node)
  const endLine = node.loc?.end.line || startLine
  const loopContext = createLoopContext('do-while')

  const meta: ExecutionMeta = {
    blockType: BlockContext.WHILE, // Reuse WHILE for do-while
    blockRange: { start: startLine || 1, end: endLine || 1 },
  }

  try {
    incrementLoopDepth(context)

    // Do-while executes body at least once
    do {
      // Execute loop body
      if (node.body) {
        executeLoopBody(node.body, context, pushStep, meta)

        // Use handleLoopControlFlow to properly handle control flow
        if (handleLoopControlFlow(context, pushStep)) {
          // Control flow indicates we should exit the loop
          break
        }
      }

      // Evaluate condition after body execution
      const conditionResult = Boolean(evalExpr(node.test, context))

      pushStep(getNodeLine(node.test), {
        ...meta,
        output: `Do-while condition: ${conditionResult}`,
      })

      if (!conditionResult) {
        break
      }

      loopContext.iterationCount++
    } while (shouldContinueLoopSafety(loopContext, context))

    // Clean up any remaining control flow state
    resetLoopControlFlow(context)

    pushStep(startLine, {
      ...meta,
      output: `Do-while loop completed after ${loopContext.iterationCount + 1} iterations`,
    })

    return { type: 'normal' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    pushStep(startLine, {
      ...meta,
      output: `Error in do-while loop: ${errorMessage}`,
    })
    return { type: 'normal' }
  } finally {
    decrementLoopDepth(context)
  }
}

/**
 * Execute loop body with proper control flow handling
 */
function executeLoopBody(
  body: t.Statement,
  context: EnhancedExecutionContext,
  pushStep: PushStepFn,
  parentMeta?: ExecutionMeta,
): ControlFlowResult {
  if (t.isBlockStatement(body)) {
    // Execute all statements in the block
    return executeStatements(body.body, context, pushStep, parentMeta)
  } else {
    // Execute single statement
    return evalStmt(body, context, pushStep, parentMeta)
  }
}
