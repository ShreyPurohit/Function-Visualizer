'use client'

import { cn } from '@/lib/utils'
import { ExecutionContext, VariableValue } from '@/types/execution'
import { m } from 'framer-motion'
import { AlertTriangle, FileText, Hash, ToggleLeft, Type, Variable } from 'lucide-react'

interface VariableInspectorProps {
  variables: ExecutionContext
}

interface VariableItemProps {
  name: string
  value: VariableValue
  depth?: number
}

const VariableItem: React.FC<VariableItemProps> = ({ name, value, depth = 0 }) => {
  const getValueType = (val: VariableValue): string => {
    if (val === null) return 'null'
    if (Array.isArray(val)) return 'array'
    return typeof val
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string':
        return <FileText className='h-3 w-3 text-green-600' />
      case 'number':
        return <Hash className='h-3 w-3 text-blue-600' />
      case 'boolean':
        return <ToggleLeft className='h-3 w-3 text-purple-600' />
      case 'array':
        return <Type className='h-3 w-3 text-orange-600' />
      case 'object':
        return <Type className='h-3 w-3 text-red-600' />
      case 'null':
        return <AlertTriangle className='h-3 w-3 text-gray-500' />
      default:
        return <Variable className='h-3 w-3 text-gray-500' />
    }
  }

  const formatValue = (val: VariableValue): string => {
    const type = getValueType(val)

    switch (type) {
      case 'string':
        return `"${val}"`
      case 'number':
        return String(val)
      case 'boolean':
        return val ? 'true' : 'false'
      case 'null':
        return 'null'
      case 'undefined':
        return 'undefined'
      case 'array':
        return `Array(${(val as unknown[]).length})`
      case 'object':
        return `Object{${Object.keys(val as Record<string, unknown>).length}}`
      default:
        return String(val)
    }
  }

  const isExpandable = (val: VariableValue): boolean => {
    return typeof val === 'object' && val !== null
  }

  const valueType = getValueType(value)
  const canExpand = isExpandable(value)

  return (
    <m.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-md border opacity-50 transition-all',
        depth === 0 ? 'border-gray-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50',
      )}
      style={{ marginLeft: depth * 12 }}
    >
      <div className='flex items-center justify-between gap-2 p-3'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          {/* Type Icon */}
          <div className='flex-shrink-0'>{getTypeIcon(valueType)}</div>

          {/* Variable Name */}
          <span className='truncate font-mono text-sm font-semibold text-blue-700'>{name}</span>

          {/* Type Badge */}
          <span
            className={cn(
              'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
              valueType === 'string' && 'bg-green-100 text-green-700',
              valueType === 'number' && 'bg-blue-100 text-blue-700',
              valueType === 'boolean' && 'bg-purple-100 text-purple-700',
              valueType === 'array' && 'bg-orange-100 text-orange-700',
              valueType === 'object' && 'bg-red-100 text-red-700',
              (valueType === 'null' || valueType === 'undefined') && 'bg-gray-100 text-gray-700',
            )}
          >
            {valueType}
          </span>
        </div>

        <div className='flex flex-shrink-0 items-center gap-2'>
          {/* Value */}
          <span className='max-w-32 truncate text-right font-mono text-sm text-gray-700'>
            {formatValue(value)}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {canExpand && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className='space-y-1 border-t border-gray-100 p-2'
        >
          {Array.isArray(value)
            ? value.map((item, index) => (
                <VariableItem
                  key={index}
                  name={`[${index}]`}
                  value={item as VariableValue}
                  depth={depth + 1}
                />
              ))
            : Object.entries(value as Record<string, VariableValue>).map(([key, val]) => (
                <VariableItem key={key} name={key} value={val} depth={depth + 1} />
              ))}
        </m.div>
      )}
    </m.div>
  )
}

const VariableInspector: React.FC<VariableInspectorProps> = ({ variables }) => {
  // Filter out internal variables
  const filteredVariables = Object.entries(variables).filter(([key]) => !key.startsWith('__'))

  return (
    <div className='space-y-3'>
      {/* Variables List */}
      {filteredVariables.length === 0 ? (
        <div className='flex flex-col items-center gap-2 py-8 text-center text-gray-400 italic'>
          <p>{Object.keys(variables).length === 0 && 'No variables declared yet.'}</p>
        </div>
      ) : (
        <div className='space-y-2'>
          {filteredVariables.map(([key, value]) => (
            <VariableItem key={key} name={key} value={value} />
          ))}
        </div>
      )}
    </div>
  )
}

export default VariableInspector
