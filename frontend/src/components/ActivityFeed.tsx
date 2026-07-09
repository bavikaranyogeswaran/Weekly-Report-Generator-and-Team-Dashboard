import { useQuery } from '@tanstack/react-query'
import { getActivityFeed } from '@/api/dashboard'
import ProjectBadge from '@/components/ProjectBadge'
import type { ActivityItem } from '@/lib/types'

// Format "2026-07-07" → "7 Jul" without UTC shift
function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

// Relative time from an ISO timestamp: "just now", "2 h ago", "3 days ago"
function relativeTime(isoStr: string): string {
  const diffMs = Date.now() - new Date(isoStr).getTime()
  const mins  = Math.floor(diffMs / 60_000)
  const hours = Math.floor(diffMs / 3_600_000)
  const days  = Math.floor(diffMs / 86_400_000)
  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins} min ago`
  if (hours < 24) return `${hours} h ago`
  if (days  <  7) return `${days} day${days !== 1 ? 's' : ''} ago`
  return fmtDate(isoStr.slice(0, 10))
}

// Two-letter initials from a full name ("Jane Smith" → "JS")
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

// Stable avatar background derived from name — cycles through 5 indigo/teal/violet shades
const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-sky-100 text-sky-700',
]
function avatarColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// ── Single feed row ───────────────────────────────────────────────────────────
function FeedRow({ item }: { item: ActivityItem }) {
  const name = item.user.name
  return (
    <li className="flex items-start gap-3 py-3">
      {/* Avatar — initials on a stable background, never the data colour */}
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(name)}`}
      >
        {initials(name)}
      </span>

      <div className="min-w-0 flex-1">
        {/* Name + relative time on one line */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-gray-800">{name}</span>
          <span className="shrink-0 text-xs text-gray-400">
            {item.submittedAt ? relativeTime(item.submittedAt) : '—'}
          </span>
        </div>

        {/* Week range + project badge (dot colour comes from projects.color) */}
        <p className="mt-0.5 text-xs text-gray-500">
          {fmtDate(item.weekStart)} – {fmtDate(item.weekEnd)}
          {item.project && (
            <ProjectBadge
              name={item.project.name}
              color={item.project.color}
              className="ml-2 text-gray-400"
            />
          )}
        </p>
      </div>
    </li>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
export function ActivityFeedSkeleton() {
  return (
    <ul className="animate-pulse divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <li key={i} className="flex items-start gap-3 py-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-1.5 pt-1">
            <div className="h-3.5 w-32 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Feed ──────────────────────────────────────────────────────────────────────
export default function ActivityFeed() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'activity-feed'],
    queryFn: () => getActivityFeed(10).then((r) => r.data),
  })

  if (isLoading) return <ActivityFeedSkeleton />

  if (isError || !data) {
    return (
      <p className="py-4 text-sm text-gray-400">Could not load activity.</p>
    )
  }

  if (data.length === 0) {
    return (
      <p className="py-4 text-sm text-gray-400">No reports submitted yet.</p>
    )
  }

  return (
    // max-h keeps the feed from pushing the page layout too tall on large teams
    <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
      {data.map((item: ActivityItem) => (
        <FeedRow key={item.id} item={item} />
      ))}
    </ul>
  )
}
