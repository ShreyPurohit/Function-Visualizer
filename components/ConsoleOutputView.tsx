'use client'

import { valueToString } from '@/lib/execution/helpers/evalExpr'
import { ExecutionStep, VariableValue } from '@/types/execution'
import { TerminalSquare } from 'lucide-react'
import { useMemo } from 'react'

interface ConsoleOutputViewProps {
  steps: ExecutionStep[]
  currentStepIndex: number
}

const ConsoleOutputView: React.FC<ConsoleOutputViewProps> = ({ steps, currentStepIndex }) => {
  const logs = useMemo(() => {
    return steps
      .slice(0, currentStepIndex + 1)
      .filter((s) => s.output !== undefined)
      .map((s, index) => ({ id: index, value: s.output }))
  }, [steps, currentStepIndex])

  return (
    <article
      aria-label='Console Output Log'
      className='h-48 space-y-1 overflow-y-auto rounded-md border border-gray-700 bg-black p-4 font-mono text-xs text-green-400'
    >
      {logs.length === 0 ? (
        <div className='flex items-center gap-2 text-gray-500 italic'>
          <TerminalSquare className='h-4 w-4 text-gray-600' aria-hidden='true' />
          No console output yet.
        </div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className='break-words'>
            {Array.isArray(log.value)
              ? log.value.map((v, i) => <span key={i}>{valueToString(v)} </span>)
              : valueToString(log.value as VariableValue)}
          </div>
        ))
      )}
    </article>
  )
}

export default ConsoleOutputView
