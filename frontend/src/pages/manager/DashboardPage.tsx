import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from '@/api/dashboard'
import StatCard, { StatCardSkeleton } from '@/components/ui/StatCard'
import SubmissionStatusChart from '@/components/charts/SubmissionStatusChart'
import WeeklyTrendsChart from '@/components/charts/WeeklyTrendsChart'
import WorkloadChart from '@/components/charts/WorkloadChart'
import ActivityFeed from '@/components/ActivityFeed'

// ── Shared card wrapper ────────────────────────────────────────────────────────
// Keeps all chart containers visually consistent without repeating the same HTML
interface ChartCardProps {
  title: string
  subtitle: string
  children: React.ReactNode
  className?: string
}
function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      <p className="mb-3 mt-0.5 text-xs text-gray-400">{subtitle}</p>
      {children}
    </div>
  )
}

// ── Summary stats row ─────────────────────────────────────────────────────────
function SummaryRow() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => getDashboardSummary().then((r) => r.data),
    // Keep stats fresh without requiring a manual page reload
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => <StatCardSkeleton key={i} />)}
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
        // Accent shifts with health: green ≥80%, amber ≥50%, rose below
        accent={
          data.submissionRate >= 80 ? 'green'
          : data.submissionRate >= 50 ? 'amber'
          : 'rose'
        }
      />
      <StatCard
        label="Open blockers"
        value={data.openBlockers}
        sublabel="this week"
        // Rose when there are blockers, green when clear
        accent={data.openBlockers > 0 ? 'rose' : 'green'}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Team overview for this week</p>
        </div>
        {/* Live badge — lets the manager know data is not stale */}
        <span className="mt-1 flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Live
        </span>
      </div>

      {/* Row 1 — four headline KPIs */}
      <SummaryRow />

      {/* Row 2 — submission donut (1 col) + weekly trend area chart (2 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Submission status" subtitle="Current week">
          <SubmissionStatusChart />
        </ChartCard>

        <ChartCard
          title="Weekly submissions"
          subtitle="Submitted reports over the last 8 weeks"
          className="lg:col-span-2"
        >
          <WeeklyTrendsChart />
        </ChartCard>
      </div>

      {/* Row 3 — workload bar chart (1 col) + activity feed (1 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Team workload" subtitle="Total hours logged across all submitted reports">
          <WorkloadChart />
        </ChartCard>

        <ChartCard title="Recent activity" subtitle="Latest submitted reports">
          <ActivityFeed />
        </ChartCard>
      </div>

    </div>
  )
}
