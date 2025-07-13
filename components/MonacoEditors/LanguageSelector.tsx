import { staggerChildrenVariants } from '@/utils/animations/monacoAnimations'
import { m } from 'framer-motion'

interface LanguageSelectorProps {
  language: 'javascript' | 'typescript'
  onLanguageChange: (language: 'javascript' | 'typescript') => void
  className?: string
}

/**
 * Component for selecting the programming language
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onLanguageChange,
  className = '',
}) => {
  return (
    <m.div
      className={className}
      variants={staggerChildrenVariants}
      initial='hidden'
      animate='visible'
    >
      <m.label
        htmlFor='language'
        className='mb-2 block text-sm font-medium text-gray-700'
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Choose Language
      </m.label>
      <m.select
        id='language'
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as 'javascript' | 'typescript')}
        className='w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        whileFocus={{ scale: 1.02 }}
      >
        <option value='javascript'>JavaScript</option>
        <option value='typescript'>TypeScript</option>
      </m.select>
    </m.div>
  )
}
