import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Cell,
} from 'recharts'
import { getWorkload } from '@/api/dashboard'
import type { WorkloadItem } from '@/lib/types'

// Categorical slot 1 — blue from reference palette, light mode
// Single nominal series: all bars wear the same hue (never colour by value)
const BAR_COLOR = '#2a78d6'
// Hairline grid colour from palette chrome
const GRID_COLOR = '#e1e0d9'

// First name only when the full name would overflow the Y-axis label area
function shortName(name: string): string {
  const parts = name.trim().split(' ')
  return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0]
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({
  active, payload,
}: {
  active?: boolean
  payload?: { payload: { name: string; totalHours: number } }[]
}) {
  if (!active || !payload?.length) return null
  const { name, totalHours } = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-gray-800">{name}</p>
      <p className="mt-0.5 text-gray-500">
        {totalHours} hour{totalHours !== 1 ? 's' : ''} logged
      </p>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
export function WorkloadSkeleton() {
  return (
    <div className="animate-pulse space-y-3 py-2">
      {[75, 55, 90, 40, 65].map((w, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-3 w-16 rounded bg-gray-200" />
          <div className="h-5 rounded bg-gray-200" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  )
}

// ── Chart ─────────────────────────────────────────────────────────────────────
export default function WorkloadChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'workload'],
    queryFn: () => getWorkload().then((r) => r.data),
  })

  if (isLoading) return <WorkloadSkeleton />

  if (isError || !data) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        Could not load workload data.
      </p>
    )
  }

  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        No submitted reports yet.
      </p>
    )
  }

  // Flatten for Recharts; backend already orders by totalHours DESC
  const chartData = data.map((item: WorkloadItem) => ({
    name: item.user.name,
    shortName: shortName(item.user.name),
    totalHours: item.totalHours,
  }))

  // Chart height scales with member count so bars stay ≤24px thick
  // 40px per row + 32px top/bottom padding
  const chartHeight = Math.max(chartData.length * 40 + 32, 160)

  // X-axis domain: 0 → max + small margin so end labels don't clip
  const maxHours = Math.max(...chartData.map((d) => d.totalHours), 1)
  const xMax = Math.ceil(maxHours * 1.15)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 40, bottom: 0, left: 8 }}
        barCategoryGap="30%"   // negative space between rows
      >
        {/* Vertical hairlines only — guide the eye to values on the x-axis */}
        <CartesianGrid
          horizontal={false}
          vertical={true}
          stroke={GRID_COLOR}
          strokeWidth={1}
        />

        <XAxis
          type="number"
          domain={[0, xMax]}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#898781' }}   // muted ink token
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          type="category"
          dataKey="shortName"
          width={72}
          tick={{ fontSize: 12, fill: '#52514e' }}   // secondary ink token
          axisLine={false}
          tickLine={false}
        />

        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />

        <Bar
          dataKey="totalHours"
          barSize={20}           // ≤24px per mark spec
          radius={[0, 4, 4, 0]} // 4px rounded data-end; square at baseline (left)
        >
          {/* All bars same hue — never colour by value for nominal data */}
          {chartData.map((_, i) => (
            <Cell key={i} fill={BAR_COLOR} />
          ))}

          {/* Value at the bar tip — secondary ink, tabular nums for column alignment */}
          <LabelList
            dataKey="totalHours"
            position="right"
            style={{
              fontSize: 11,
              fill: '#52514e',                     // secondary ink token
              fontVariantNumeric: 'tabular-nums',  // aligns in a column
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
