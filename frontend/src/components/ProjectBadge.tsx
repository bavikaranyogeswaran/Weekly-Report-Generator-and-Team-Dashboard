// Small "colour dot + name" badge for a project.
// The dot uses the project's colour from the database (projects.color),
// so every page shows the same colour for the same project.

type ProjectBadgeProps = {
  name: string
  color?: string | null   // hex like "#6366f1" — falls back to gray when missing
  className?: string      // lets callers control text size/colour of the name
}

// gray-400 — used when a project somehow has no colour set
const FALLBACK_COLOR = '#9ca3af'

export default function ProjectBadge({ name, color, className = '' }: ProjectBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Inline style is required here — the hex value comes from the API,
          so it can't be a static Tailwind class */}
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: color || FALLBACK_COLOR }}
      />
      <span className="truncate">{name}</span>
    </span>
  )
}
