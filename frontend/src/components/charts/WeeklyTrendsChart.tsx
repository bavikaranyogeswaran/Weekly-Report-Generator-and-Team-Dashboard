import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { getWeeklyTrends } from '@/api/dashboard'
import type { WeeklyTrendItem } from '@/lib/types'

// Sequential blue — step 450 from reference palette, light mode
// Single series → no legend box (the card title names the series)
const SERIES_COLOR = '#2a78d6'
// Area fill: same hue at ~10% opacity (a wash, never a saturated block)
const AREA_FILL = 'rgba(42,120,214,0.10)'
// Hairline gridline colour from palette chrome
const GRID_COLOR = '#e1e0d9'

// Format "2026-07-07" → "Jul 7" without UTC shift
function fmtWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}

// ── Custom tooltip — crosshair + popup ───────────────────────────────────────
function ChartTooltip({
  active, payload, label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const count = payload[0].value
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-gray-800">Week of {label}</p>
      <p className="mt-0.5 text-gray-500">
        {count} task{count !== 1 ? 's' : ''} completed
      </p>
    </div>
  )
}

// ── Custom dot — ≥8px diameter with 2px surface-colour ring (mark spec) ──────
function ChartDot(props: {
  cx?: number; cy?: number; value?: number; index?: number; dataLength?: number
}) {
  const { cx, cy } = props
  if (cx === undefined || cy === undefined) return null
  return (
    <g>
      {/* 2px white surface ring so the dot stays legible over the area fill */}
      <circle cx={cx} cy={cy} r={6} fill="white" />
      <circle cx={cx} cy={cy} r={4} fill={SERIES_COLOR} />
    </g>
  )
}

// Selective direct label — shown only on the last (current) data point
// Recharts types x/y as string | number and value as RenderableText,
// so we accept the wide types and coerce to numbers before drawing
function EndLabel(props: {
  x?: number | string; y?: number | string; value?: unknown
  index?: number; total?: number
}) {
  const { index, total } = props
  if (index === undefined || total === undefined || index !== total - 1) return null
  if (props.x === undefined || props.y === undefined || props.value === undefined) return null
  const x = Number(props.x)
  const y = Number(props.y)
  const value = Number(props.value)
  return (
    <text
      x={x}
      y={y - 10}
      textAnchor="middle"
      fontSize={11}
      fontWeight={600}
      fill="#52514e"   // secondary ink token — text never wears the series colour
    >
      {value}
    </text>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
export function WeeklyTrendsSkeleton() {
  return (
    <div className="animate-pulse space-y-2 py-2">
      <div className="flex items-end gap-1 h-36">
        {[40, 65, 30, 80, 55, 70, 45, 90].map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-gray-200" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="flex justify-between">
        {[1,2,3,4,5,6,7,8].map((i) => (
          <div key={i} className="h-3 w-8 rounded bg-gray-100" />
        ))}
      </div>
    </div>
  )
}

// ── Chart ─────────────────────────────────────────────────────────────────────
export default function WeeklyTrendsChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'weekly-trends'],
    queryFn: () => getWeeklyTrends(8).then((r) => r.data),
  })

  if (isLoading) return <WeeklyTrendsSkeleton />

  if (isError || !data) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        Could not load weekly trends.
      </p>
    )
  }

  // Attach formatted label for the x-axis
  const chartData = data.map((item: WeeklyTrendItem) => ({
    ...item,
    label: fmtWeek(item.weekStart),
  }))

  // Y-axis upper bound: max value + 1, minimum ceiling of 5 so empty weeks aren't flat
  const maxVal = Math.max(...chartData.map((d) => d.tasksCompleted), 0)
  const yMax = Math.max(maxVal + 1, 5)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 20, right: 12, bottom: 0, left: -10 }}>
        {/* Hairline grid — 1px solid, recessive colour, no vertical lines */}
        <CartesianGrid
          horizontal={true}
          vertical={false}
          stroke={GRID_COLOR}
          strokeWidth={1}
        />

        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#898781' }}   // muted ink token
          axisLine={false}
          tickLine={false}
          interval={0}
        />

        <YAxis
          domain={[0, yMax]}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#898781' }}
          axisLine={false}
          tickLine={false}
          width={24}
        />

        <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }} />

        <Area
          type="monotone"
          dataKey="tasksCompleted"
          stroke={SERIES_COLOR}
          strokeWidth={2}            // 2px line per mark spec
          fill={AREA_FILL}           // ~10% opacity wash
          dot={(props) => <ChartDot key={`dot-${props.index}`} {...props} />}
          activeDot={{ r: 5, fill: SERIES_COLOR, stroke: 'white', strokeWidth: 2 }}
          label={(props) => (
            <EndLabel
              key={`label-${props.index}`}
              {...props}
              total={chartData.length}
            />
          )}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
