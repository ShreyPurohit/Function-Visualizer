import { parse, ParserOptions } from '@babel/parser'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Enhanced validation function for JavaScript/TypeScript code
 * Uses Babel parser for comprehensive syntax checking
 */
export const validateCode = (code: string): ValidationResult => {
  const errors: string[] = []

  if (!code.trim()) {
    return { isValid: false, errors: ['Code cannot be empty'] }
  }

  try {
    // Use Babel parser for comprehensive syntax checking
    const parserOptions: ParserOptions = {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'asyncGenerators',
        'functionBind',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining',
      ] as const,
    }

    parse(code, parserOptions)

    // Additional bracket matching validation
    const bracketErrors = validateBracketMatching(code)
    errors.push(...bracketErrors)

    return { isValid: errors.length === 0, errors }
  } catch (error) {
    let errorMessage = 'Syntax error'
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      errorMessage = error.message.replace(/\(\d+:\d+\)/, '').trim()
    }
    return { isValid: false, errors: [errorMessage] }
  }
}

/**
 * Validates bracket matching in code
 */
const validateBracketMatching = (code: string): string[] => {
  const errors: string[] = []

  const openBraces = (code.match(/\{/g) || []).length
  const closeBraces = (code.match(/\}/g) || []).length
  const openParens = (code.match(/\(/g) || []).length
  const closeParens = (code.match(/\)/g) || []).length
  const openBrackets = (code.match(/\[/g) || []).length
  const closeBrackets = (code.match(/\]/g) || []).length

  if (openBraces !== closeBraces) {
    errors.push('Mismatched curly braces')
  }
  if (openParens !== closeParens) {
    errors.push('Mismatched parentheses')
  }
  if (openBrackets !== closeBrackets) {
    errors.push('Mismatched square brackets')
  }

  return errors
}
