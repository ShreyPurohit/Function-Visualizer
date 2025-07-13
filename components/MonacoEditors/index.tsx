'use client'

import { getDefaultEditorOptions } from '@/components/MonacoEditors/utils/monacoConfig'
import {
  containerVariants,
  editorVariants,
  sidebarVariants,
  staggerChildrenVariants,
} from '@/utils/animations/monacoAnimations'
import Editor from '@monaco-editor/react'
import { m } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CodeStatusIndicator } from './CodeStatusIndicator'
import { ErrorDisplay } from './ErrorDisplay'
import { LanguageSelector } from './LanguageSelector'
import { SubmitButton } from './SubmitButton'
import { useMonacoEditor } from './hooks/useMonacoEditor'

interface MonacoEditorProps {
  onSubmit?: (code: string) => void
  initialLanguage?: 'javascript' | 'typescript'
}

/**
 * Enhanced Monaco Editor component with comprehensive error handling
 */
const MonacoEditor: React.FC<MonacoEditorProps> = ({
  onSubmit,
  initialLanguage = 'javascript',
}) => {
  const [language, setLanguage] = useState<'javascript' | 'typescript'>(initialLanguage)
  const router = useRouter()

  const {
    editorRef,
    code,
    setCode,
    allErrors,
    hasAnyErrors,
    handleEditorDidMount,
    validateCurrentCode,
  } = useMonacoEditor({ language })

  const handleSubmit = () => {
    const value = editorRef.current?.getValue()?.trim() || ''

    if (!value) return
    if (hasAnyErrors) return

    const validation = validateCurrentCode()
    if (!validation.isValid) return

    setCode(value)

    if (onSubmit) {
      onSubmit(value)
    } else {
      router.push('/execute')
    }
  }

  return (
    <m.main
      className='mx-auto max-w-screen-xl p-4 md:p-6 lg:p-8'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      <m.section className='flex flex-col gap-4 md:flex-row' layout>
        <m.article className='w-full md:w-2/3' variants={staggerChildrenVariants}>
          <m.div
            className='overflow-hidden rounded-lg border shadow-sm'
            variants={editorVariants}
            whileHover={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: { duration: 0.2 },
            }}
          >
            <Editor
              height='300px'
              defaultLanguage='javascript'
              value={code}
              language={language}
              theme='vs'
              onMount={handleEditorDidMount}
              onChange={(value) => {
                if (value !== undefined) {
                  setCode(value)
                }
              }}
              options={getDefaultEditorOptions()}
            />
          </m.div>

          <ErrorDisplay errors={allErrors} />
        </m.article>

        <m.aside
          className='flex w-full flex-col justify-between gap-4 pt-2 md:w-1/3'
          variants={sidebarVariants}
        >
          <m.div className='space-y-4' variants={staggerChildrenVariants}>
            <LanguageSelector language={language} onLanguageChange={setLanguage} />

            <CodeStatusIndicator hasErrors={hasAnyErrors} />
          </m.div>

          <m.div variants={staggerChildrenVariants}>
            <SubmitButton hasErrors={hasAnyErrors} onSubmit={handleSubmit} />
          </m.div>
        </m.aside>
      </m.section>
    </m.main>
  )
}

export default MonacoEditor
