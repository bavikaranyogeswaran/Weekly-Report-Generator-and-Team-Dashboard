import { useQuery } from '@tanstack/react-query'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import { getSubmissionStatus } from '@/api/dashboard'
import type { SubmissionStatusValue, SubmissionStatusItem } from '@/lib/types'

// Status palette (fixed — from reference palette.md, never themed)
// warning (#fab219) and critical (#d03b3b) are sub-3:1 on light surface —
// mitigated by the legend labels and tooltip (required secondary encoding)
const STATUS_COLOR: Record<SubmissionStatusValue, string> = {
  SUBMITTED: '#0ca30c',  // good
  DRAFT:     '#fab219',  // warning
  MISSING:   '#d03b3b',  // critical
}

const STATUS_LABEL: Record<SubmissionStatusValue, string> = {
  SUBMITTED: 'Submitted',
  DRAFT:     'Draft',
  MISSING:   'Missing',
}

// Fixed display order: best → worst state
const STATUS_ORDER: SubmissionStatusValue[] = ['SUBMITTED', 'DRAFT', 'MISSING']

type SliceData = { status: SubmissionStatusValue; count: number; pct: number }

function buildSlices(items: SubmissionStatusItem[]): SliceData[] {
  const counts: Record<SubmissionStatusValue, number> = { SUBMITTED: 0, DRAFT: 0, MISSING: 0 }
  items.forEach((item) => { counts[item.status]++ })
  const total = items.length || 1
  return STATUS_ORDER
    .filter((s) => counts[s] > 0)
    .map((s) => ({
      status: s,
      count: counts[s],
      pct: Math.round((counts[s] / total) * 100),
    }))
}

// ── Custom tooltip — shows label+count+pct; carries the meaning that fill alone cannot ──
function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: SliceData }[] }) {
  if (!active || !payload?.length) return null
  const { status, count, pct } = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <span className="font-medium text-gray-800">{STATUS_LABEL[status]}</span>
      <span className="ml-2 text-gray-500">
        {count} member{count !== 1 ? 's' : ''} · {pct}%
      </span>
    </div>
  )
}

// ── Colour-coded legend — provides label+count for the sub-3:1 slices (DRAFT, MISSING) ──
function ChartLegend({ slices }: { slices: SliceData[] }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
      {slices.map(({ status, count }) => (
        <div key={status} className="flex items-center gap-1.5 text-sm">
          {/* Coloured dot — identity mark, never the text itself */}
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: STATUS_COLOR[status] }}
          />
          <span className="text-gray-600">{STATUS_LABEL[status]}</span>
          <span className="font-semibold text-gray-900">{count}</span>
        </div>
      ))}
    </div>
  )
}

// ── Custom label rendered inside each slice — only when the slice is ≥15% to avoid crowding ──
function SliceLabel({
  cx, cy, midAngle, innerRadius, outerRadius, pct, count,
}: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number
  pct: number; count: number
}) {
  if (pct < 15) return null   // too small — falls back to legend + tooltip
  const RADIAN = Math.PI / 180
  // Place label at 60% along the radius
  const r = innerRadius + (outerRadius - innerRadius) * 0.6
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x} y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
      fill="#ffffff"
      fontSize={12}
      fontWeight={600}
    >
      {count}
    </text>
  )
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
export function SubmissionStatusSkeleton() {
  return (
    <div className="animate-pulse flex flex-col items-center gap-3 py-4">
      <div className="h-44 w-44 rounded-full bg-gray-200" />
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-4 w-20 rounded bg-gray-100" />)}
      </div>
    </div>
  )
}

// ── Chart ────────────────────────────────────────────────────────────────────
export default function SubmissionStatusChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'submission-status'],
    queryFn: () => getSubmissionStatus().then((r) => r.data),
  })

  if (isLoading) return <SubmissionStatusSkeleton />

  if (isError || !data) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        Could not load submission status.
      </p>
    )
  }

  const slices = buildSlices(data)

  if (slices.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        No team members yet.
      </p>
    )
  }

  return (
    <div>
      {/* Donut chart — 3 slices max, status palette, direct count labels inside */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={slices}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            dataKey="count"
            // 2px surface-colour gap between adjacent slices (from mark spec)
            paddingAngle={2}
            labelLine={false}
            label={(props: any) => (
              <SliceLabel
                cx={props.cx}
                cy={props.cy}
                midAngle={props.midAngle}
                innerRadius={props.innerRadius}
                outerRadius={props.outerRadius}
                pct={props.payload?.pct ?? 0}
                count={props.payload?.count ?? 0}
              />
            )}
          >
            {slices.map((slice) => (
              <Cell key={slice.status} fill={STATUS_COLOR[slice.status]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with count — required secondary encoding for sub-3:1 fills */}
      <ChartLegend slices={slices} />
    </div>
  )
}
