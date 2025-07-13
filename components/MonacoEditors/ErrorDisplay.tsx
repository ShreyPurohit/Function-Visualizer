import { cn } from '@/lib/utils'
import { errorVariants, iconVariants } from '@/utils/animations/monacoAnimations'
import { AnimatePresence, m } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

interface ErrorDisplayProps {
  errors: string[]
  className?: string
}

/**
 * Component for displaying validation errors in a consistent format
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors, className = '' }) => {
  return (
    <AnimatePresence mode='wait'>
      {errors.length > 0 && (
        <m.div
          className={cn(
            'mt-3 overflow-hidden rounded-md border border-red-200 bg-red-50 p-3',
            className,
          )}
          variants={errorVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          layout
        >
          <div className='flex items-start'>
            <m.div
              className='flex-shrink-0'
              variants={iconVariants}
              initial='hidden'
              animate='visible'
            >
              <AlertCircle className='h-5 w-5 text-red-400' />
            </m.div>
            <div className='ml-3'>
              <m.h3
                className='text-sm font-medium text-red-800'
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {errors.length === 1 ? 'Error found:' : `${errors.length} errors found:`}
              </m.h3>
              <m.div
                className='mt-2'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <ul className='list-inside list-disc space-y-1 text-sm text-red-700'>
                  {errors.map((error, index) => (
                    <m.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.1 * (index + 3),
                        duration: 0.3,
                      }}
                    >
                      {error}
                    </m.li>
                  ))}
                </ul>
              </m.div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
