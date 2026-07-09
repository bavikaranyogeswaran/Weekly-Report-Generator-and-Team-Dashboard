import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Cell,
} from 'recharts'
import { getWorkload } from '@/api/dashboard'
import type { WorkloadItem } from '@/lib/types'

// Hairline grid colour from palette chrome
const GRID_COLOR = '#e1e0d9'

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({
  active, payload,
}: {
  active?: boolean
  payload?: { payload: { name: string; color: string; totalHours: number } }[]
}) {
  if (!active || !payload?.length) return null
  const { name, color, totalHours } = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <div className="flex items-center gap-2">
        {/* Project colour swatch */}
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <p className="font-medium text-gray-800">{name}</p>
      </div>
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
        No submitted reports with hours logged yet.
      </p>
    )
  }

  // Flatten to a Recharts-friendly shape; backend already orders by totalHours DESC
  const chartData = data.map((item: WorkloadItem) => ({
    name:       item.project.name,
    color:      item.project.color,
    totalHours: item.totalHours,
  }))

  // Chart height scales with project count so bars stay ≤24px thick
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
          dataKey="name"
          width={88}
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
          {/* Each bar wears its project's own colour */}
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}

          {/* Value at the bar tip — secondary ink, tabular nums for column alignment */}
          <LabelList
            dataKey="totalHours"
            position="right"
            style={{
              fontSize: 11,
              fill: '#52514e',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
