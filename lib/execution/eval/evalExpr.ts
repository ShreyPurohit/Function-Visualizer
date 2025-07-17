import { ExecutionContext, ExecutionMeta, VariableValue } from '@/types/execution'
import * as t from '@babel/types'
import { executeStatements } from './evalStmt'
import {
  CallStackFrame,
  EnhancedExecutionContext,
  PushStepFn,
  createFunctionScope,
  decrementFunctionDepth,
  getCallStackDepth,
  getFunction,
  getNodeLine,
  incrementFunctionDepth,
  popCallStackFrame,
  pushCallStackFrame
} from './evalUtils'

// Constants
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER
const CONSOLE_LOG_METHODS = ['log', 'warn', 'error', 'info'] as const

/**
 * Type guard to check if a value is a valid numeric operation operand
 */
function isNumericOperand(value: VariableValue): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Safely converts a value to string for template literals
 */
export function valueToString(value: VariableValue): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '[Object]'
    }
  }

  return String(value)
}

/**
 * Apply expressions like assignments, updates, declarations, and console operations
 */
export function applyExpr(
  expr: t.Expression | t.VariableDeclaration | null | undefined,
  context: ExecutionContext,
  currentStepMeta?: ExecutionMeta,
): void {
  if (!expr) return

  try {
    if (t.isVariableDeclaration(expr)) {
      handleVariableDeclaration(expr, context)
      return
    }

    if (t.isAssignmentExpression(expr)) {
      handleAssignmentExpression(expr, context)
      return
    }

    if (t.isUpdateExpression(expr)) {
      handleUpdateExpression(expr, context)
      return
    }

    if (t.isCallExpression(expr)) {
      handleCallExpression(expr, context, currentStepMeta)
      return
    }
  } catch (error) {
    console.warn('Error applying expression:', error)
    // In a real application, you might want to add this to the step meta
    if (currentStepMeta) {
      currentStepMeta.output = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Handle variable declarations
 */
function handleVariableDeclaration(
  declaration: t.VariableDeclaration,
  context: ExecutionContext,
): void {
  declaration.declarations.forEach((declarator) => {
    if (t.isIdentifier(declarator.id)) {
      context[declarator.id.name] = evalExpr(declarator.init, context)
    }
    // TODO: Handle destructuring patterns if needed
  })
}

/**
 * Handle assignment expressions with type safety
 */
function handleAssignmentExpression(expr: t.AssignmentExpression, context: ExecutionContext): void {
  if (!t.isIdentifier(expr.left)) {
    // TODO: Handle member expressions, destructuring, etc.
    return
  }

  const variableName = expr.left.name
  const rightValue = evalExpr(expr.right, context)

  switch (expr.operator) {
    case '=':
      context[variableName] = rightValue
      break
    case '+=':
      context[variableName] = performNumericOperation(
        context[variableName],
        rightValue,
        (a, b) => a + b,
      )
      break
    case '-=':
      context[variableName] = performNumericOperation(
        context[variableName],
        rightValue,
        (a, b) => a - b,
      )
      break
    case '*=':
      context[variableName] = performNumericOperation(
        context[variableName],
        rightValue,
        (a, b) => a * b,
      )
      break
    case '/=':
      context[variableName] = performNumericOperation(context[variableName], rightValue, (a, b) =>
        b !== 0 ? a / b : Infinity,
      )
      break
    case '%=':
      context[variableName] = performNumericOperation(context[variableName], rightValue, (a, b) =>
        b !== 0 ? a % b : NaN,
      )
      break
    default:
      console.warn(`Unsupported assignment operator: ${expr.operator}`)
  }
}

/**
 * Safely perform numeric operations
 */
function performNumericOperation(
  left: VariableValue,
  right: VariableValue,
  operation: (a: number, b: number) => number,
): number {
  const leftNum = Number(left)
  const rightNum = Number(right)

  if (!isNumericOperand(leftNum) || !isNumericOperand(rightNum)) {
    return NaN
  }

  const result = operation(leftNum, rightNum)
  return Math.abs(result) > MAX_SAFE_INTEGER ? Infinity : result
}

/**
 * Handle update expressions (++, --)
 */
function handleUpdateExpression(expr: t.UpdateExpression, context: ExecutionContext): void {
  if (!t.isIdentifier(expr.argument)) {
    return
  }

  const variableName = expr.argument.name
  const currentValue = context[variableName]
  const numValue = Number(currentValue)

  if (!isNumericOperand(numValue)) {
    context[variableName] = NaN
    return
  }

  const newValue = expr.operator === '++' ? numValue + 1 : numValue - 1
  context[variableName] =
    Math.abs(newValue) > MAX_SAFE_INTEGER ? (newValue > 0 ? Infinity : -Infinity) : newValue
}

/**
 * Handle function calls (primarily console methods)
 */
function handleCallExpression(
  expr: t.CallExpression,
  context: ExecutionContext,
  currentStepMeta?: ExecutionMeta,
): void {
  if (isConsoleMethod(expr)) {
    // Fix: Handle different argument types properly
    const output = expr.arguments
      .filter((arg): arg is t.Expression => t.isExpression(arg))
      .map((arg) => evalExpr(arg, context))

    if (currentStepMeta) {
      currentStepMeta.output = output.length === 1 ? output[0] : output
    }
    return
  }

  // Handle user-defined function calls
  if (t.isIdentifier(expr.callee)) {
    const functionName = expr.callee.name
    const enhancedContext = context as EnhancedExecutionContext
    const functionDef = getFunction(enhancedContext, functionName)

    if (functionDef) {
      // This is a function call - we need a pushStep function to handle it properly
      // For now, we'll store the call info in the meta
      if (currentStepMeta) {
        currentStepMeta.output = `Function call: ${functionName}(...)`
      }
    }
  }
}

/**
 * Execute a function call with proper scope management
 */
export function executeFunctionCall(
  expr: t.CallExpression,
  context: EnhancedExecutionContext,
  pushStep: PushStepFn,
): VariableValue {
  if (!t.isIdentifier(expr.callee)) {
    pushStep(getNodeLine(expr), {
      output: 'Error: Only simple function calls are supported',
    })
    return undefined
  }

  const functionName = expr.callee.name
  const functionDef = getFunction(context, functionName)

  if (!functionDef) {
    pushStep(getNodeLine(expr), {
      output: `Error: Function '${functionName}' is not defined`,
    })
    return undefined
  }

  // Check for maximum call stack depth to prevent infinite recursion
  const maxCallStackDepth = 50
  if (getCallStackDepth(context) >= maxCallStackDepth) {
    pushStep(getNodeLine(expr), {
      output: `Error: Maximum call stack size exceeded`,
    })
    return undefined
  }

  // Evaluate arguments
  const args = expr.arguments
    .filter((arg): arg is t.Expression => t.isExpression(arg))
    .map(arg => evalExpr(arg, context))

  // Check parameter count
  if (args.length !== functionDef.params.length) {
    pushStep(getNodeLine(expr), {
      output: `Warning: Function '${functionName}' expects ${functionDef.params.length} arguments, got ${args.length}`,
    })
  }

  // Create parameter mapping
  const parameters: Record<string, unknown> = {}
  functionDef.params.forEach((param, index) => {
    parameters[param] = index < args.length ? args[index] : undefined
  })

  // Create call stack frame
  const callFrame: CallStackFrame = {
    functionName,
    parameters,
    localVariables: {},
    line: getNodeLine(expr),
  }

  pushStep(getNodeLine(expr), {
    output: `Calling function '${functionName}' with arguments: [${args.map(arg =>
      typeof arg === 'string' ? `"${arg}"` : String(arg)
    ).join(', ')}]`,
  })

  try {
    // Save current scope
    const previousScope = { ...context }

    // Increment function depth
    incrementFunctionDepth(context)

    // Push call stack frame
    pushCallStackFrame(context, callFrame)

    // Create new function scope
    const functionScope = createFunctionScope(context, parameters)

    // Replace context with function scope
    Object.keys(context).forEach(key => {
      if (!key.startsWith('__')) {
        delete context[key]
      }
    })
    Object.assign(context, functionScope)

    pushStep(getNodeLine(functionDef.node), {
      output: `Entering function '${functionName}'`,
    })

    // Execute function body
    const result = executeStatements(functionDef.body.body, context, pushStep)

    let returnValue: VariableValue = undefined

    // Handle return value
    if (result.type === 'return') {
      returnValue = result.value as VariableValue
      pushStep(getNodeLine(functionDef.node), {
        output: `Function '${functionName}' returned: ${returnValue}`,
      })
    } else {
      pushStep(getNodeLine(functionDef.node), {
        output: `Function '${functionName}' completed (no return value)`,
      })
    }

    // Update call frame with return value
    callFrame.returnValue = returnValue

    return returnValue

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    pushStep(getNodeLine(expr), {
      output: `Error in function '${functionName}': ${errorMessage}`,
    })
    return undefined
  } finally {
    // Clean up: restore scope and call stack
    popCallStackFrame(context)
    decrementFunctionDepth(context)

    // Restore previous scope
    const previousScope = { ...context }
    Object.keys(context).forEach(key => {
      if (!key.startsWith('__')) {
        delete context[key]
      }
    })

    // Restore global variables but keep function-related context
    Object.keys(previousScope).forEach(key => {
      if (key.startsWith('__')) {
        context[key] = previousScope[key]
      } else {
        // Only restore if it was a global variable (existed before function call)
        if (key in previousScope) {
          context[key] = previousScope[key]
        }
      }
    })

    pushStep(getNodeLine(expr), {
      output: `Exiting function '${functionName}'`,
    })
  }
}

/**
 * Check if a call expression is a console method
 */
function isConsoleMethod(expr: t.CallExpression): boolean {
  return (
    t.isMemberExpression(expr.callee) &&
    t.isIdentifier(expr.callee.object, { name: 'console' }) &&
    t.isIdentifier(expr.callee.property) &&
    CONSOLE_LOG_METHODS.includes(expr.callee.property.name as (typeof CONSOLE_LOG_METHODS)[number])
  )
}

/**
 * Lightweight recursive expression evaluator with improved type safety
 */
export function evalExpr(
  expr: t.Expression | t.PatternLike | null | undefined,
  context: ExecutionContext,
): VariableValue {
  if (!expr) return undefined

  try {
    // Literals
    if (t.isNumericLiteral(expr)) {
      return expr.value
    }

    if (t.isDecimalLiteral?.(expr)) {
      return parseFloat(expr.value)
    }

    if (t.isStringLiteral(expr)) {
      return expr.value
    }

    if (t.isBooleanLiteral(expr)) {
      return expr.value
    }

    if (t.isNullLiteral(expr)) {
      return null
    }

    // Identifiers
    if (t.isIdentifier(expr)) {
      if (Object.prototype.hasOwnProperty.call(context, expr.name)) {
        return context[expr.name]
      }
      // In strict mode, we might want to throw here
      console.warn(`Variable '${expr.name}' is undefined`)
      return undefined
    }

    // Template literals
    if (t.isTemplateLiteral(expr)) {
      return evaluateTemplateLiteral(expr, context)
    }

    // Unary expressions
    if (t.isUnaryExpression(expr)) {
      return evaluateUnaryExpression(expr, context)
    }

    // Binary expressions
    if (t.isBinaryExpression(expr)) {
      return evaluateBinaryExpression(expr, context)
    }

    // Logical expressions
    if (t.isLogicalExpression(expr)) {
      return evaluateLogicalExpression(expr, context)
    }

    // Arrays
    if (t.isArrayExpression(expr)) {
      return expr.elements.map((element) => {
        // Handle null elements and spread elements
        if (!element) return undefined
        if (t.isSpreadElement(element)) {
          // For spread elements, we could try to evaluate the argument
          // but for simplicity, we'll return a placeholder
          return '[Spread]'
        }
        return evalExpr(element, context)
      })
    }

    // Objects (basic support)
    if (t.isObjectExpression(expr)) {
      const result: Record<string, VariableValue> = {}
      expr.properties.forEach((prop) => {
        if (t.isObjectProperty(prop) && !prop.computed) {
          let key: string
          if (t.isIdentifier(prop.key)) {
            key = prop.key.name
          } else if (t.isStringLiteral(prop.key)) {
            key = prop.key.value
          } else if (t.isNumericLiteral(prop.key)) {
            key = String(prop.key.value)
          } else {
            key = '[Complex Key]'
          }

          // Ensure the value is an expression before evaluating
          if (t.isExpression(prop.value)) {
            result[key] = evalExpr(prop.value, context)
          } else {
            result[key] = '[Complex Value]'
          }
        }
      })
      return result
    }

    // Conditional expressions (ternary)
    if (t.isConditionalExpression(expr)) {
      const test = evalExpr(expr.test, context)
      return test ? evalExpr(expr.consequent, context) : evalExpr(expr.alternate, context)
    }

    // Member expressions (e.g., obj.a or obj["a"])
    if (t.isMemberExpression(expr)) {
      const object = evalExpr(expr.object, context)
      let propertyKey: string | number | undefined

      if (expr.computed) {
        if (t.isExpression(expr.property)) {
          const computedKey = evalExpr(expr.property, context)

          if (typeof computedKey === 'string' || typeof computedKey === 'number') {
            propertyKey = computedKey
          } else {
            console.warn(`Invalid computed property: ${computedKey}`)
            return undefined
          }
        } else {
          console.warn(`Computed property is not an expression: ${expr.property.type}`)
          return undefined
        }
      } else if (t.isIdentifier(expr.property)) {
        propertyKey = expr.property.name
      } else {
        console.warn(`Unsupported property access for non-identifier: ${expr.property.type}`)
        return undefined
      }

      if (
        object &&
        typeof object === 'object' &&
        propertyKey !== undefined &&
        Object.prototype.hasOwnProperty.call(object, propertyKey)
      ) {
        return (object as Record<string | number, VariableValue>)[propertyKey]
      }

      console.warn(`Member access failed: ${JSON.stringify({ object, propertyKey })}`)
      return undefined
    }

    // Assignment expressions (e.g., x = 5)
    if (t.isAssignmentExpression(expr)) {
      if (t.isIdentifier(expr.left)) {
        const varName = expr.left.name
        const value = evalExpr(expr.right, context)
        context[varName] = value
        return value
      } else {
        console.warn(`Unsupported assignment target: ${expr.left.type}`)
        return undefined
      }
    }

    // Sequence expressions: (x = 1, y = 2, x + y)
    if (t.isSequenceExpression(expr)) {
      let finalValue: VariableValue = undefined
      for (const subExpr of expr.expressions) {
        finalValue = evalExpr(subExpr, context)
      }
      return finalValue
    }

    // Function calls
    if (t.isCallExpression(expr)) {
      // For function calls in expression context, we need special handling
      if (t.isIdentifier(expr.callee)) {
        const functionName = expr.callee.name
        const enhancedContext = context as EnhancedExecutionContext
        const functionDef = getFunction(enhancedContext, functionName)

        if (functionDef) {
          // This should be handled by executeFunctionCall, but we don't have pushStep here
          // Return a placeholder for now
          return `[Function Call: ${functionName}]`
        }
      }

      // Handle console methods and other built-in calls
      if (isConsoleMethod(expr)) {
        return undefined // Console calls don't return values
      }

      return undefined
    }

    console.warn(`Unsupported expression type: ${expr.type}`)
    return undefined
  } catch (error) {
    console.warn('Error evaluating expression:', error)
    return undefined
  }
}

/**
 * Evaluate template literals safely
 */
function evaluateTemplateLiteral(expr: t.TemplateLiteral, context: ExecutionContext): string {
  let result = ''

  for (let i = 0; i < expr.quasis.length; i++) {
    result += expr.quasis[i].value.raw

    if (i < expr.expressions.length) {
      const expression = expr.expressions[i]
      // Filter out TypeScript types and only evaluate expressions
      if (t.isExpression(expression)) {
        const expressionValue = evalExpr(expression, context)
        result += valueToString(expressionValue)
      } else {
        result += '[Unsupported Expression]'
      }
    }
  }

  return result
}

/**
 * Evaluate unary expressions
 */
function evaluateUnaryExpression(
  expr: t.UnaryExpression,
  context: ExecutionContext,
): VariableValue {
  const operand = evalExpr(expr.argument, context)

  switch (expr.operator) {
    case '-':
      return -Number(operand)
    case '+':
      return +Number(operand)
    case '!':
      return !operand
    case 'typeof':
      return typeof operand
    default:
      console.warn(`Unsupported unary operator: ${expr.operator}`)
      return undefined
  }
}

/**
 * Evaluate binary expressions with proper type handling
 */
function evaluateBinaryExpression(
  expr: t.BinaryExpression,
  context: ExecutionContext,
): VariableValue {
  if (!t.isExpression(expr.left) || !t.isExpression(expr.right)) {
    console.warn('Invalid operands for binary expression')
    return undefined
  }

  const left = evalExpr(expr.left, context)
  const right = evalExpr(expr.right, context)

  if (left == null || right == null) {
    console.warn('Binary expression operand is null or undefined')
    return undefined
  }

  switch (expr.operator) {
    case '+':
      // Handle string concatenation vs numeric addition
      if (typeof left === 'string' || typeof right === 'string') {
        return valueToString(left) + valueToString(right)
      }
      return Number(left) + Number(right)
    case '-':
      return Number(left) - Number(right)
    case '*':
      return Number(left) * Number(right)
    case '/':
      return Number(right) !== 0 ? Number(left) / Number(right) : Infinity
    case '%':
      return Number(right) !== 0 ? Number(left) % Number(right) : NaN
    case '<':
      return left < right
    case '<=':
      return left <= right
    case '>':
      return left > right
    case '>=':
      return left >= right
    case '===':
      return left === right
    case '!==':
      return left !== right
    case '==':
      return left == right
    case '!=':
      return left != right
    default:
      console.warn(`Unsupported binary operator: ${expr.operator}`)
      return undefined
  }
}

/**
 * Evaluate logical expressions with short-circuiting
 */
function evaluateLogicalExpression(
  expr: t.LogicalExpression,
  context: ExecutionContext,
): VariableValue {
  const left = evalExpr(expr.left, context)

  switch (expr.operator) {
    case '&&':
      return left ? evalExpr(expr.right, context) : left
    case '||':
      return left ? left : evalExpr(expr.right, context)
    case '??':
      return left != null ? left : evalExpr(expr.right, context)
    default:
      console.warn(`Unsupported logical operator: ${expr.operator}`)
      return undefined
  }
}
