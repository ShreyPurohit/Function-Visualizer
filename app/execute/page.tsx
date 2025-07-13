'use client'

import CodeHighlighter from '@/components/CodeHighlighter'
import ExecutionContextView from '@/components/ExecutionContextView'
import StepControls from '@/components/StepControls'
import VariableInspector from '@/components/VariableInspector'
import { getExecutionSteps } from '@/lib/execution/getExecutionSteps'
import { useCodeStore } from '@/stores/useCodeStore'
import { ExecutionStep } from '@/types/execution'
import { AnimatePresence, m } from 'framer-motion'
import { AlertTriangle, Ban, BarChart, BookOpen, Boxes, Code2, ScrollText } from 'lucide-react'

import {
  codeCardVariants,
  contentTransitionVariants,
  contextCardVariants,
  controlsCardVariants,
  errorStateVariants,
  gridContainerVariants,
  headerVariants,
  metadataItemVariants,
  metadataVariants,
  variableCardVariants,
  warningStateVariants,
} from '@/utils/animations/executionAnimations'
import { iconVariants } from '@/utils/animations/monacoAnimations'
import { useEffect, useMemo, useState } from 'react'

const ExecutePage = () => {
  const code = useCodeStore((s) => s.code)
  const language = useCodeStore((s) => s.language)

  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const steps: ExecutionStep[] = useMemo(() => {
    if (!code) return []
    try {
      setError(null)
      return getExecutionSteps(code)
    } catch (err) {
      setError((err as Error)?.message || 'Parsing error')
      return []
    }
  }, [code])

  useEffect(() => {
    setStepIndex(0)
  }, [steps])

  const currentStep = steps[stepIndex]

  if (!code) {
    return (
      <m.main
        className='flex min-h-screen flex-col items-center justify-center p-6 text-center text-gray-600'
        variants={warningStateVariants}
        initial='hidden'
        animate='visible'
      >
        <m.div
          className='flex items-center gap-2 text-yellow-600'
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <m.div variants={iconVariants} initial='hidden' animate='visible'>
            <AlertTriangle className='h-5 w-5' aria-hidden='true' />
          </m.div>
          <m.p
            className='text-base'
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            No code found. Please return to the editor and submit your function.
          </m.p>
        </m.div>
      </m.main>
    )
  }

  if (error) {
    return (
      <m.main
        className='flex min-h-screen flex-col items-center justify-center p-6 text-center text-red-500'
        variants={errorStateVariants}
        initial='hidden'
        animate='visible'
      >
        <m.div
          className='mb-2 flex items-center gap-2 text-red-600'
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <m.div variants={iconVariants} initial='hidden' animate='visible'>
            <Ban className='h-5 w-5' aria-hidden='true' />
          </m.div>
          <m.p
            className='text-base font-medium'
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Error during parsing:
          </m.p>
        </m.div>
        <m.pre
          className='mt-2 w-full max-w-xl overflow-auto rounded bg-red-100 p-4 text-left text-sm text-red-800'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {error}
        </m.pre>
      </m.main>
    )
  }

  return (
    <m.main
      className='mx-auto grid min-h-screen max-w-7xl grid-cols-1 grid-rows-[auto,1fr] gap-4 bg-gray-50 p-4 md:grid-cols-3'
      variants={gridContainerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Code Area */}
      <m.section
        className='overflow-auto rounded-xl bg-white p-4 shadow md:col-span-2'
        variants={codeCardVariants}
        initial='hidden'
        animate='visible'
        whileHover={{
          scale: 1.02,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          transition: {
            duration: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        }}
      >
        <m.h2
          className='mb-2 flex items-center gap-2 text-lg font-semibold'
          variants={headerVariants}
        >
          <m.div variants={iconVariants} initial='hidden' animate='visible'>
            <Code2 className='h-5 w-5 text-blue-600' aria-hidden='true' />
          </m.div>
          <m.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            Code Execution
          </m.span>
        </m.h2>
        <div key={stepIndex}>
          <CodeHighlighter
            code={code}
            currentLine={currentStep?.line ?? 0}
            activeBlock={
              currentStep?.blockType && currentStep?.blockRange
                ? {
                    type: currentStep.blockType,
                    range: [currentStep.blockRange.start, currentStep.blockRange.end],
                  }
                : undefined
            }
          />
        </div>
      </m.section>

      {/* Variable Inspector */}
      <m.section
        className='rounded-xl bg-white p-4 shadow md:col-span-1'
        variants={variableCardVariants}
        initial='hidden'
        animate='visible'
        whileHover={{
          scale: 1.02,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          transition: {
            duration: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        }}
      >
        <m.h2
          className='mb-2 flex items-center gap-2 text-lg font-semibold'
          variants={headerVariants}
        >
          <m.div variants={iconVariants} initial='hidden' animate='visible'>
            <Boxes className='h-5 w-5 text-green-600' aria-hidden='true' />
          </m.div>
          <m.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            Variables
          </m.span>
        </m.h2>
        <AnimatePresence mode='wait'>
          <m.div
            key={`variables-${stepIndex}`}
            variants={contentTransitionVariants}
            initial='hidden'
            animate='visible'
            exit='hidden'
          >
            <VariableInspector variables={currentStep?.variables || {}} />
          </m.div>
        </AnimatePresence>
      </m.section>

      {/* Execution Context */}
      <m.section
        className='rounded-xl bg-white p-4 shadow md:col-span-2'
        variants={contextCardVariants}
        initial='hidden'
        animate='visible'
        whileHover={{
          scale: 1.02,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          transition: {
            duration: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        }}
      >
        <m.h2
          className='mb-2 flex items-center gap-2 text-lg font-semibold'
          variants={headerVariants}
        >
          <m.div variants={iconVariants} initial='hidden' animate='visible'>
            <BookOpen className='h-5 w-5 text-purple-600' aria-hidden='true' />
          </m.div>
          <m.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            Execution Context
          </m.span>
        </m.h2>
        <div key={`context-${stepIndex}`}>
          <ExecutionContextView allSteps={steps} currentStepIndex={stepIndex} step={currentStep} />
        </div>
      </m.section>

      {/* Step Controls + Metadata */}
      <m.aside
        className='flex flex-col justify-between rounded-xl bg-white p-4 shadow md:col-span-1'
        variants={controlsCardVariants}
        initial='hidden'
        animate='visible'
        whileHover={{
          scale: 1.02,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          transition: {
            duration: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        }}
      >
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <StepControls
            currentStep={stepIndex}
            totalSteps={steps.length}
            onStepChange={setStepIndex}
          />
        </m.div>

        <m.div
          className='mt-4 space-y-2 text-center text-sm text-gray-500'
          variants={metadataVariants}
          initial='hidden'
          animate='visible'
        >
          <m.div className='flex items-center justify-center gap-2' variants={metadataItemVariants}>
            <m.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.8,
                duration: 0.4,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            >
              <ScrollText className='h-4 w-4 text-gray-500' aria-hidden='true' />
            </m.div>
            <m.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.4 }}
            >
              Language: <strong>{language}</strong>
            </m.p>
          </m.div>
          <m.div className='flex items-center justify-center gap-2' variants={metadataItemVariants}>
            <m.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 1.0,
                duration: 0.4,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            >
              <BarChart className='h-4 w-4 text-gray-500' aria-hidden='true' />
            </m.div>
            <m.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.4 }}
            >
              Total steps: <strong>{steps.length}</strong>
            </m.p>
          </m.div>
        </m.div>
      </m.aside>
    </m.main>
  )
}

export default ExecutePage
