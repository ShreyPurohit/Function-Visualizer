'use client'

import { useCodeStore } from '@/stores/useCodeStore'
import type { OnMount } from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { validateCode, type ValidationResult } from '../utils/codeValidation'
import { configureMonacoLanguageServices } from '../utils/monacoConfig'

type IStandaloneCodeEditor = Parameters<OnMount>[0]
type Monaco = Parameters<OnMount>[1]

interface UseMonacoEditorProps {
  language: 'javascript' | 'typescript'
}

interface UseMonacoEditorReturn {
  editorRef: React.RefObject<IStandaloneCodeEditor | null>
  code: string
  setCode: (code: string) => void
  editorHasErrors: boolean
  errorMessages: string[]
  validationErrors: string[]
  allErrors: string[]
  hasAnyErrors: boolean
  handleEditorDidMount: OnMount
  validateCurrentCode: () => ValidationResult
}

/**
 * Custom hook for managing Monaco Editor state and validation
 */
export const useMonacoEditor = ({ language }: UseMonacoEditorProps): UseMonacoEditorReturn => {
  const editorRef = useRef<IStandaloneCodeEditor>(null)
  const monacoRef = useRef<Monaco>(null)
  const code = useCodeStore((s) => s.code)
  const setCode = useCodeStore((s) => s.setCode)

  const [editorHasErrors, setEditorHasErrors] = useState(false)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const validateCurrentCode = useCallback((): ValidationResult => {
    const currentCode = editorRef.current?.getValue() || code
    return validateCode(currentCode)
  }, [code])

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor
      monacoRef.current = monaco

      configureMonacoLanguageServices(monaco)

      const model = editor.getModel()
      if (model) {
        // Listen for marker changes (Monaco's built-in error detection)
        const markerListener = monaco.editor.onDidChangeMarkers(() => {
          const markers = monaco.editor.getModelMarkers({
            resource: model.uri,
          })
          const errors = markers
            .filter((marker) => marker.severity === monaco.MarkerSeverity.Error)
            .map((marker) => marker.message)

          setEditorHasErrors(errors.length > 0)
          setErrorMessages(errors)
        })

        // Listen for content changes to validate in real-time
        const contentListener = model.onDidChangeContent(() => {
          const currentValue = model.getValue()
          const validation = validateCode(currentValue)
          setValidationErrors(validation.errors)
          setCode(currentValue)
        })

        // Cleanup listeners
        return () => {
          try {
            markerListener.dispose()
            contentListener.dispose()
          } catch (e) {
            console.warn('Failed to dispose Monaco listeners', e)
          }
        }
      }
    },
    [setCode],
  )

  // Re-validate when language changes
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue()
      const validation = validateCode(currentValue)
      setValidationErrors(validation.errors)
    }
  }, [language])

  // Combine all error messages
  const allErrors = [...errorMessages, ...validationErrors]
  const hasAnyErrors = editorHasErrors || validationErrors.length > 0

  return {
    editorRef,
    code,
    setCode,
    editorHasErrors,
    errorMessages,
    validationErrors,
    allErrors,
    hasAnyErrors,
    handleEditorDidMount,
    validateCurrentCode,
  }
}
