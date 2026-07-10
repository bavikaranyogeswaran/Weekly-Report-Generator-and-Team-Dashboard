import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Cell,
} from 'recharts'
import { getWorkload } from '@/api/dashboard'
import type { WorkloadItem } from '@/lib/types'

// Fallback colour used for user bars (users don't have an assigned hex)
const USER_BAR_COLOR = '#2a78d6'
const GRID_COLOR     = '#e1e0d9'

type GroupBy = 'project' | 'user'

// ── Toggle pill ───────────────────────────────────────────────────────────────
function GroupToggle({
  value, onChange,
}: {
  value: GroupBy
  onChange: (v: GroupBy) => void
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 text-xs font-medium">
      {(['project', 'user'] as const).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={[
            'rounded-md px-2.5 py-1 capitalize transition',
            value === opt
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          ].join(' ')}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({
  active, payload,
}: {
  active?: boolean
  payload?: { payload: WorkloadItem }[]
}) {
  if (!active || !payload?.length) return null
  const { name, color, totalHours } = payload[0].payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color ?? USER_BAR_COLOR }}
        />
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
  const [groupBy, setGroupBy] = useState<GroupBy>('project')

  const { data, isLoading, isError } = useQuery({
    // Re-fetches automatically whenever groupBy changes
    queryKey: ['dashboard', 'workload', groupBy],
    queryFn: () => getWorkload(groupBy).then((r) => r.data),
  })

  return (
    <div>
      {/* Toggle — sits above the chart, right-aligned */}
      <div className="mb-3 flex justify-end">
        <GroupToggle value={groupBy} onChange={setGroupBy} />
      </div>

      {isLoading && <WorkloadSkeleton />}

      {isError && (
        <p className="py-6 text-center text-sm text-gray-400">
          Could not load workload data.
        </p>
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">
          {/* The Project view is empty whenever no reports are tagged to a project —
              even if members logged hours. Say so plainly and point to the User view,
              otherwise the copy reads as "nobody logged any hours" which is misleading. */}
          {groupBy === 'project'
            ? 'No hours logged against a project yet — switch to User to see hours by person.'
            : 'No submitted reports with hours logged yet.'}
        </p>
      )}

      {!isLoading && !isError && data && data.length > 0 && (() => {
        // Chart height scales with row count so bars stay ≤24px thick
        const chartHeight = Math.max(data.length * 40 + 32, 160)
        const maxHours    = Math.max(...data.map((d) => d.totalHours), 1)
        const xMax        = Math.ceil(maxHours * 1.15)

        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 4, right: 40, bottom: 0, left: 8 }}
              barCategoryGap="30%"
            >
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
                tick={{ fontSize: 11, fill: '#898781' }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                type="category"
                dataKey="name"
                width={88}
                tick={{ fontSize: 12, fill: '#52514e' }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />

              <Bar dataKey="totalHours" barSize={20} radius={[0, 4, 4, 0]}>
                {/* Project bars use their own colour; user bars share the default blue */}
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color ?? USER_BAR_COLOR} />
                ))}

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
      })()}
    </div>
  )
}
