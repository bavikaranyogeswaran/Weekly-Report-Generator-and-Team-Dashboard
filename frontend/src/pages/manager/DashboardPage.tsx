import { useQuery } from '@tanstack/react-query'
import {
  getDashboardSummary,
} from '@/api/dashboard'
import StatCard, { StatCardSkeleton } from '@/components/ui/StatCard'

// ── Summary stats row ─────────────────────────────────────────────────────────

function SummaryRow() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => getDashboardSummary().then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load summary stats.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Team members"
        value={data.totalUsers}
        accent="indigo"
      />
      <StatCard
        label="Projects"
        value={data.totalProjects}
        accent="indigo"
      />
      <StatCard
        label="Submitted this week"
        value={data.submittedThisWeek}
        sublabel={`of ${data.totalUsers} members`}
        accent="green"
      />
      <StatCard
        label="Submission rate"
        value={`${data.submissionRate}%`}
        sublabel="this week"
        accent={data.submissionRate >= 80 ? 'green' : data.submissionRate >= 50 ? 'amber' : 'rose'}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Team overview for this week</p>
      </div>

      <SummaryRow />

      {/* Charts and activity feed — added in steps 12.4–12.8 */}
    </div>
  )
}
