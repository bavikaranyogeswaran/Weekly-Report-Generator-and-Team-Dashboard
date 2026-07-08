import type { InputHTMLAttributes } from 'react'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

// Labeled input with optional error message below.
// Accepts all standard <input> props (type, placeholder, value, onChange, etc.)
export default function InputField({ label, error, id, className, ...props }: InputFieldProps) {
  // Derive a stable id from the label if none is provided
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        id={inputId}
        className={[
          'rounded-lg border px-3 py-2 text-sm outline-none transition',
          'focus:ring-2',
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-gray-300 focus:border-indigo-400 focus:ring-indigo-200',
          className ?? '',
        ].join(' ')}
        {...props}
      />

      {/* Error message — only rendered when the error prop is non-empty */}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
