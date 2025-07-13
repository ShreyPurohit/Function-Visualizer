'use client'

import { cn } from '@/lib/utils'
import { BlockContext, ExecutionStep } from '@/types/execution'
import { Brain, ChevronRight, Info, Lightbulb, Ruler, Type } from 'lucide-react'
import ConsoleOutputView from './ConsoleOutputView'

interface Props {
  step?: ExecutionStep
  allSteps: ExecutionStep[]
  currentStepIndex: number
}

const blockLabels: Record<BlockContext, string> = {
  [BlockContext.FUNCTION]: 'Function Block',
  [BlockContext.FOR]: 'For Loop',
  [BlockContext.WHILE]: 'While Loop',
  [BlockContext.IF]: 'If Condition',
  [BlockContext.ELSE]: 'Else Condition',
}

const blockColors: Record<BlockContext, string> = {
  [BlockContext.FUNCTION]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [BlockContext.FOR]: 'bg-blue-100 text-blue-700 border-blue-200',
  [BlockContext.WHILE]: 'bg-green-100 text-green-700 border-green-200',
  [BlockContext.IF]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [BlockContext.ELSE]: 'bg-orange-100 text-orange-700 border-orange-200',
}

const ExecutionContextView: React.FC<Props> = ({ step, allSteps, currentStepIndex }) => {
  if (!step) {
    return (
      <section
        aria-label='Execution Context'
        className='flex h-32 items-center justify-center gap-2 text-sm text-gray-400 italic'
      >
        <Info className='h-4 w-4' />
        No execution context available.
      </section>
    )
  }

  const { code, line, blockType, blockRange, output } = step
  const label = blockType ? blockLabels[blockType] : null
  const colorClass = blockType ? blockColors[blockType] : ''

  const isError = typeof output === 'string' && output.startsWith('Error:')

  return (
    <section
      aria-label='Execution Context'
      className='space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm'
    >
      {/* Line Number */}
      <div className='flex items-center gap-2 leading-0'>
        <ChevronRight className='h-4 w-4 text-blue-500' aria-hidden='true' />
        <strong className='text-gray-700'>Current Line:</strong>
        <span className='rounded bg-blue-50 px-2 py-1 font-mono text-blue-600'>{line}</span>
      </div>

      {/* Code Block */}
      <article aria-label='Code Snippet'>
        <div className='mb-2 flex items-center gap-2'>
          <Lightbulb className='h-4 w-4 text-yellow-500' aria-hidden='true' />
          <strong className='text-gray-700'>Code:</strong>
        </div>
        <pre
          className={cn(
            'overflow-x-auto rounded-md border p-3 text-sm leading-relaxed',
            isError
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-gray-200 bg-gray-100 text-gray-800',
          )}
        >
          <code className='font-mono break-words whitespace-pre-wrap'>{code}</code>
        </pre>
      </article>

      {/* Console Output (Full log) */}
      <ConsoleOutputView steps={allSteps} currentStepIndex={currentStepIndex} />

      {/* Contextual Info */}
      <article aria-label='Block Context'>
        <div className='mb-3 flex items-center gap-2'>
          <Brain className='h-4 w-4 text-purple-600' aria-hidden='true' />
          <strong className='text-gray-700'>Context:</strong>
        </div>

        {blockType && blockRange ? (
          <div className='mt-1 space-y-3'>
            <div className='flex items-center gap-3'>
              <Type className='h-4 w-4 text-gray-500' aria-hidden='true' />
              <span className={cn('rounded-md border px-3 py-1 text-xs font-medium', colorClass)}>
                {label}
              </span>
            </div>

            <div className='flex items-center gap-3 text-gray-600'>
              <Ruler className='h-4 w-4 text-gray-400' aria-hidden='true' />
              <span>
                Line Range:{' '}
                <span className='rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800'>
                  {blockRange.start} — {blockRange.end}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <p className='mt-1 text-gray-500 italic'>This line is not part of any specific block.</p>
        )}
      </article>
    </section>
  )
}

export default ExecutionContextView
