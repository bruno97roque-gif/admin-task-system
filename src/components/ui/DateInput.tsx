import { forwardRef, useId, useRef, type RefObject } from 'react'
import { IoCalendarOutline } from 'react-icons/io5'
import { formatDateDisplay, toDateInputValue } from '../../utils/date'

interface DateInputProps {
  label: string
  error?: string
  value?: string
  name?: string
  onChange?: (event: { target: { value: string; name?: string } }) => void
  onBlur?: (event: { target: { value: string; name?: string } }) => void
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { label, error, value = '', name, onChange, onBlur },
  ref,
) {
  const generatedId = useId()
  const inputId = `date-${generatedId}`
  const fallbackRef = useRef<HTMLInputElement>(null)
  const dateInputRef = (ref as RefObject<HTMLInputElement>) ?? fallbackRef

  const isoValue = toDateInputValue(value)
  const displayValue = formatDateDisplay(isoValue)

  const openPicker = () => {
    dateInputRef.current?.showPicker?.()
    dateInputRef.current?.focus()
  }

  const handleDateChange = (nextValue: string) => {
    onChange?.({ target: { value: nextValue, name } })
  }

  const handleBlur = () => {
    onBlur?.({ target: { value: isoValue, name } })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          id={inputId}
          onClick={openPicker}
          onBlur={handleBlur}
          className={`flex w-full items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2 text-left text-sm text-slate-100 focus:border-accent focus:ring-1 focus:ring-accent ${error ? 'border-red-500' : ''}`}
        >
          <span className={displayValue ? 'text-slate-100' : 'text-slate-500'}>
            {displayValue || 'DD/MM/AAAA'}
          </span>
          <IoCalendarOutline size={18} className="shrink-0 text-slate-400" />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          name={name}
          lang="es"
          value={isoValue}
          onChange={(e) => handleDateChange(e.target.value)}
          onBlur={handleBlur}
          className="pointer-events-none absolute inset-0 opacity-0"
          tabIndex={-1}
          aria-hidden
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})
