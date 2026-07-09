import type { TextareaHTMLAttributes } from 'react'

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

// Labeled textarea with optional hint and error message — same visual pattern as InputField
export default function TextareaField({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: TextareaFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="ml-1 font-normal text-gray-400">({hint})</span>}
      </label>

      <textarea
        id={fieldId}
        rows={3}
        className={[
          'rounded-lg border px-3 py-2 text-sm outline-none transition resize-none',
          'focus:ring-2',
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-gray-300 focus:border-indigo-400 focus:ring-indigo-200',
          className ?? '',
        ].join(' ')}
        {...props}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
