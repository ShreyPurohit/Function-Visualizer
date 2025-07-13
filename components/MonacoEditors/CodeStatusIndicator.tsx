import { cn } from '@/lib/utils'
import { iconVariants, statusVariants } from '@/utils/animations/monacoAnimations'
import { m } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'

interface CodeStatusIndicatorProps {
  hasErrors: boolean
  className?: string
}

/**
 * Component for displaying the current validation status of the code
 */
export const CodeStatusIndicator: React.FC<CodeStatusIndicatorProps> = ({
  hasErrors,
  className = '',
}) => {
  return (
    <m.div
      className={cn('rounded-md border p-3', className)}
      variants={statusVariants}
      animate={hasErrors ? 'error' : 'success'}
      initial={false}
      layout
    >
      <div className='flex items-center justify-between'>
        <m.span
          className='text-sm font-medium text-gray-700'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Code Status:
        </m.span>
        <m.div className='flex items-center gap-2' layout>
          {hasErrors ? (
            <m.div
              className='flex items-center gap-2'
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <m.div variants={iconVariants} initial='hidden' animate='visible'>
                <XCircle className='h-4 w-4 text-red-600' />
              </m.div>
              <span className='text-sm font-semibold text-red-600'>Has Errors</span>
            </m.div>
          ) : (
            <m.div
              className='flex items-center gap-2'
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <m.div variants={iconVariants} initial='hidden' animate='visible'>
                <CheckCircle className='h-4 w-4 text-green-600' />
              </m.div>
              <span className='text-sm font-semibold text-green-600'>Valid</span>
            </m.div>
          )}
        </m.div>
      </div>
    </m.div>
  )
}
