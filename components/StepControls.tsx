'use client'

import { FastForward, Pause, Play, Rewind, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  currentStep: number
  totalSteps: number
  onStepChange: (newStep: number) => void
}

const StepControls = ({ currentStep, totalSteps, onStepChange }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  const next = () => {
    if (!isLastStep) {
      onStepChange(currentStep + 1)
    } else {
      setIsPlaying(false) // Stop auto-play at the end
    }
  }

  const prev = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1)
    }
  }

  const reset = () => {
    setIsPlaying(false)
    onStepChange(0)
  }

  const togglePlay = () => setIsPlaying((prev) => !prev)

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onStepChange(Math.min(currentStep + 1, totalSteps - 1))
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [currentStep, isPlaying, onStepChange, totalSteps])

  return (
    <section
      className='mt-4 flex flex-wrap items-center justify-center gap-4'
      aria-label='Step Controls'
    >
      {/* Prev */}
      <button
        onClick={prev}
        disabled={isFirstStep}
        className='flex items-center gap-1 rounded bg-gray-200 px-3 py-2 transition hover:bg-gray-300 disabled:opacity-50'
        aria-label='Previous Step'
      >
        <Rewind className='h-4 w-4' />
        Prev
      </button>

      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        className='flex items-center gap-1 rounded bg-blue-500 px-3 py-2 text-white transition hover:bg-blue-600'
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <>
            <Pause className='h-4 w-4' />
            Pause
          </>
        ) : (
          <>
            <Play className='h-4 w-4' />
            Play
          </>
        )}
      </button>

      {/* Next */}
      <button
        onClick={next}
        disabled={isLastStep}
        className='flex items-center gap-1 rounded bg-gray-200 px-3 py-2 transition hover:bg-gray-300 disabled:opacity-50'
        aria-label='Next Step'
      >
        <FastForward className='h-4 w-4' />
        Next
      </button>

      {/* Reset */}
      <button
        onClick={reset}
        className='flex items-center gap-1 rounded bg-red-100 px-3 py-2 text-red-600 transition hover:bg-red-200'
        aria-label='Reset Steps'
      >
        <RotateCcw className='h-4 w-4' />
        Reset
      </button>

      {/* Step Count */}
      <span className='ml-2 text-sm font-medium text-gray-600'>
        Step {currentStep + 1} of {totalSteps}
      </span>
    </section>
  )
}

export default StepControls
