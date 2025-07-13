import { cn } from '@/lib/utils'
import { buttonVariants } from '@/utils/animations/monacoAnimations'
import { m } from 'framer-motion'

interface SubmitButtonProps {
  hasErrors: boolean
  onSubmit: () => void
  className?: string
}

/**
 * Component for the submit button with proper error state handling
 */
export const SubmitButton: React.FC<SubmitButtonProps> = ({
  hasErrors,
  onSubmit,
  className = '',
}) => {
  return (
    <m.button
      onClick={onSubmit}
      disabled={hasErrors}
      className={cn(
        'w-full rounded-md px-6 py-3 text-sm font-semibold text-white transition-colors duration-200',
        hasErrors
          ? 'cursor-not-allowed bg-gray-400'
          : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
        className,
      )}
      variants={buttonVariants}
      initial='idle'
      animate={hasErrors ? 'disabled' : 'idle'}
      whileHover={hasErrors ? undefined : 'hover'}
      whileTap={hasErrors ? undefined : 'tap'}
      layout
    >
      {hasErrors ? 'Fix Errors to Submit' : 'Submit Code'}
    </m.button>
  )
}
