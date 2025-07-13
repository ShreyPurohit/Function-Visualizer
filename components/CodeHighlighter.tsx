'use client'

import { BlockContext } from '@/types/execution'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { useEffect, useRef } from 'react'

type CodeHighlighterProps = {
  code: string
  currentLine: number
  activeBlock?: {
    type: BlockContext
    range: [number, number]
  }
}

// Tailwind background classes for each block type
const blockColorMap: Record<BlockContext, string> = {
  [BlockContext.FUNCTION]: 'bg-sky-500/10',
  [BlockContext.FOR]: 'bg-blue-500/10',
  [BlockContext.WHILE]: 'bg-green-500/10',
  [BlockContext.IF]: 'bg-yellow-500/10',
  [BlockContext.ELSE]: 'bg-orange-500/10',
}

const CodeHighlighter: React.FC<CodeHighlighterProps> = ({ code, currentLine, activeBlock }) => {
  const codeRef = useRef<HTMLDivElement>(null)
  const lines = code.split('\n')

  useEffect(() => {
    const lineEl = document.getElementById(`code-line-${currentLine}`)
    if (lineEl && codeRef.current) {
      const offsetTop = lineEl.offsetTop - codeRef.current.clientHeight / 2
      codeRef.current.scrollTo({ top: offsetTop, behavior: 'smooth' })
    }
  }, [currentLine])

  return (
    <div
      ref={codeRef}
      className='max-h-[300px] overflow-y-auto rounded-md border border-gray-700 bg-gray-900 px-4 py-3 font-mono text-sm text-white'
    >
      <pre className='whitespace-pre'>
        {lines.map((line, idx) => {
          const lineNumber = idx + 1
          const isActive = lineNumber === currentLine

          const isInBlock =
            activeBlock && lineNumber >= activeBlock.range[0] && lineNumber <= activeBlock.range[1]

          const blockBgClass = isInBlock ? blockColorMap[activeBlock.type] || '' : ''

          return (
            <m.div
              key={lineNumber}
              id={`code-line-${lineNumber}`}
              className={clsx(
                'flex items-start gap-3 rounded-md px-2 py-[2px] transition-all',
                blockBgClass,
                isActive ? 'bg-blue-700/50 font-semibold' : 'hover:bg-white/5',
              )}
              layout
            >
              <span className='w-6 text-right text-gray-500 select-none'>
                {lineNumber.toString().padStart(2, ' ')}
              </span>
              <code className='break-words whitespace-pre-wrap text-white'>{line}</code>
            </m.div>
          )
        })}
      </pre>
    </div>
  )
}

export default CodeHighlighter
