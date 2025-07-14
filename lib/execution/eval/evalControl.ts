import * as t from '@babel/types'
import { evalExpr } from './evalExpr'
import {
    ControlFlowResult,
    EnhancedExecutionContext,
    PushStepFn,
    getNodeLine,
    isInsideLoop,
    setControlFlow,
    shouldInterruptExecution,
} from './evalUtils'

/**
 * Handle break statements with optional labels
 */
export function handleBreakStatement(
    node: t.BreakStatement,
    context: EnhancedExecutionContext,
    pushStep: PushStepFn,
): ControlFlowResult {
    const line = getNodeLine(node)
    const label = node.label?.name

    // Validate that break is inside a loop
    if (!isInsideLoop(context)) {
        const errorMsg = 'SyntaxError: Illegal break statement'
        pushStep(line, { output: errorMsg })
        throw new Error(errorMsg)
    }

    const result: ControlFlowResult = { type: 'break', label }
    setControlFlow(context, result)

    pushStep(line, {
        output: label ? `Break to label: ${label}` : 'Break statement executed',
    })

    return result
}

/**
 * Handle continue statements with optional labels
 */
export function handleContinueStatement(
    node: t.ContinueStatement,
    context: EnhancedExecutionContext,
    pushStep: PushStepFn,
): ControlFlowResult {
    const line = getNodeLine(node)
    const label = node.label?.name

    // Validate that continue is inside a loop
    if (!isInsideLoop(context)) {
        const errorMsg = 'SyntaxError: Illegal continue statement'
        pushStep(line, { output: errorMsg })
        throw new Error(errorMsg)
    }

    const result: ControlFlowResult = { type: 'continue', label }
    setControlFlow(context, result)

    pushStep(line, {
        output: label ? `Continue to label: ${label}` : 'Continue statement executed',
    })

    return result
}

/**
 * Handle return statements
 */
export function handleReturnStatement(
    node: t.ReturnStatement,
    context: EnhancedExecutionContext,
    pushStep: PushStepFn,
): ControlFlowResult {
    const line = getNodeLine(node)
    const returnValue = node.argument ? evalExpr(node.argument, context) : undefined

    const result: ControlFlowResult = { type: 'return', value: returnValue }
    setControlFlow(context, result)

    pushStep(line, {
        output: returnValue !== undefined ? `Return: ${returnValue}` : 'Return statement executed',
    })

    return result
}

/**
 * Check if control flow should continue to next iteration
 */
export function shouldContinueLoop(context: EnhancedExecutionContext): boolean {
    const controlFlow = context.__controlFlow
    return controlFlow?.type === 'continue'
}

/**
 * Handle control flow interruption in loops
 * Returns true if execution should stop, false if it should continue
 */
export function handleLoopControlFlow(
    context: EnhancedExecutionContext,
    pushStep: PushStepFn,
): boolean {
    if (!shouldInterruptExecution(context)) {
        return false
    }

    const controlFlow = context.__controlFlow!

    switch (controlFlow.type) {
        case 'break':
            // Break exits the loop entirely
            pushStep(undefined, { output: 'Breaking out of loop' })
            return true

        case 'continue':
            // Continue skips to next iteration
            // Reset control flow so loop can continue
            pushStep(undefined, { output: 'Continuing to next iteration' })
            context.__controlFlow = { type: 'normal' }
            return false

        case 'return':
            // Return exits everything
            pushStep(undefined, { output: 'Returning from function' })
            return true

        default:
            return false
    }
}

/**
 * Reset control flow after handling break/continue in appropriate context
 */
export function resetLoopControlFlow(context: EnhancedExecutionContext): void {
    const controlFlow = context.__controlFlow

    if (controlFlow?.type === 'break' || controlFlow?.type === 'continue') {
        context.__controlFlow = { type: 'normal' }
    }
}
