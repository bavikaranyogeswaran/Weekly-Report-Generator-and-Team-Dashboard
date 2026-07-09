import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from '@/api/dashboard'
import StatCard, { StatCardSkeleton } from '@/components/ui/StatCard'
import SubmissionStatusChart from '@/components/charts/SubmissionStatusChart'
import WeeklyTrendsChart from '@/components/charts/WeeklyTrendsChart'
import WorkloadChart from '@/components/charts/WorkloadChart'

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

      {/* Charts — top row: donut + area chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">Submission status</h2>
          <p className="mb-3 text-xs text-gray-400">Current week</p>
          <SubmissionStatusChart />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">Weekly submissions</h2>
          <p className="mb-3 text-xs text-gray-400">Last 8 weeks</p>
          <WeeklyTrendsChart />
        </div>
      </div>

      {/* Charts — second row: workload bar + activity feed (added in 12.7) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">Team workload</h2>
          <p className="mb-3 text-xs text-gray-400">Total hours logged (all time)</p>
          <WorkloadChart />
        </div>
      </div>
    </div>
  )
}
