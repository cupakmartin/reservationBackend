// src/components/ui/TimeInput.tsx
import { forwardRef } from 'react'
import type { ChangeEvent } from 'react'
import { cn } from '../../lib/utils'

interface TimeInputProps {
  label?: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  min?: string
  max?: string
  required?: boolean
  className?: string
  error?: string
}

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, label, error, value, onChange, min, max, required, ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      // Ensure the value is in HH:mm format
      if (/^\d{0,2}:\d{0,2}$/.test(newValue) || newValue === '') {
        onChange(e)
      }
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          type="time"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          required={required}
          step="60"
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        <style>{`
          input[type="time"]::-webkit-calendar-picker-indicator {
            filter: invert(0.5);
          }
          input[type="time"]::-webkit-datetime-edit-ampm-field {
            display: none;
          }
        `}</style>
      </div>
    )
  }
)

TimeInput.displayName = 'TimeInput'

export default TimeInput
