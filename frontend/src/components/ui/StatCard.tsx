interface StatCardProps {
  label: string          // sentence case, no trailing colon
  value: string | number // auto-compacted by caller (e.g. "12.9K", "84%")
  sublabel?: string      // muted context line e.g. "of 12 members"
  accent?: 'indigo' | 'green' | 'amber' | 'rose'
}

// Left-border accent stripe — the accent marks identity; value text stays in ink
const accentBorder: Record<string, string> = {
  indigo: 'border-l-indigo-500',
  green:  'border-l-green-500',
  amber:  'border-l-amber-500',
  rose:   'border-l-rose-500',
}

export default function StatCard({ label, value, sublabel, accent = 'indigo' }: StatCardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm',
        'border-l-4',
        accentBorder[accent],
      ].join(' ')}
    >
      {/* Label: sentence case, secondary ink — never the data colour */}
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {/* Value: semibold, primary ink — proportional figures (not tabular) at display size */}
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-gray-400">{sublabel}</p>}
    </div>
  )
}

// Pulse placeholder shown while the summary query is loading
export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm border-l-4 border-l-gray-200">
      <div className="h-3.5 w-28 rounded bg-gray-200" />
      <div className="mt-2 h-8 w-16 rounded bg-gray-200" />
      <div className="mt-1.5 h-3 w-20 rounded bg-gray-100" />
    </div>
  )
}
