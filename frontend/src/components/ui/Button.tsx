import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
}

// General-purpose button with loading spinner and two visual variants.
// Automatically disables itself while loading.
export default function Button({
  loading = false,
  variant = 'primary',
  fullWidth = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50'

  const variants: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  }

  return (
    <button
      disabled={disabled ?? loading}
      className={[base, variants[variant], fullWidth ? 'w-full' : '', className ?? ''].join(' ')}
      {...props}
    >
      {/* Spinner — shown only while loading */}
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
