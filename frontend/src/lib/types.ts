// Shared TypeScript types used across the frontend

// Wrapper returned by paginated list endpoints
export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Mirrors the Role enum from the backend
export type Role = 'MEMBER' | 'MANAGER' | 'ADMIN'

// Shape of the authenticated user returned by GET /auth/me
export type AuthUser = {
  id: string
  name: string
  email: string
  role: Role
  isVerified: boolean
  // True for admin-created accounts until the user changes their invite password
  mustChangePassword: boolean
  createdAt: string
}

// Mirrors the ReportStatus enum from the backend
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'LATE'

// Full report object as returned by the API
export type Report = {
  id: string
  weekStart: string        // ISO date string YYYY-MM-DD
  weekEnd: string
  tasksCompleted: string
  tasksPlanned: string
  blockers: string
  hoursWorked: number | null
  notes: string | null
  status: ReportStatus
  submittedAt: string | null
  createdAt: string
  updatedAt: string
  userId: string
  projectId: string | null
  user?: { id: string; name: string; email: string }
  project?: { id: string; name: string; color: string } | null
}

// Data sent when creating a new report (POST /reports)
export type CreateReportDto = {
  weekStart: string        // YYYY-MM-DD
  weekEnd: string
  tasksCompleted: string
  tasksPlanned: string
  blockers: string
  hoursWorked?: number
  notes?: string
  projectId?: string
}

// All fields are optional for PATCH (backend merges with existing values)
export type UpdateReportDto = Partial<CreateReportDto>

// Project as returned by GET /projects
export type Project = {
  id: string
  name: string
  description: string | null
  color: string            // hex accent colour shown as a dot next to the name
  createdAt: string
  // Only present on GET /projects/:id — the list endpoint doesn't load this relation
  members?: { id: string; name: string; email: string; role: Role }[]
}

// ── Dashboard types (manager only) ──────────────────────────────────────────

// GET /dashboard/summary — headline numbers for the top stat tiles
export type DashboardSummary = {
  totalUsers: number
  memberCount: number     // MEMBER-role users — the denominator behind submittedThisWeek/submissionRate
  totalProjects: number
  submittedThisWeek: number
  submissionRate: number  // 0–100 percentage
  openBlockers: number    // submitted reports this week with non-empty blockers field
}

// 'MISSING' means the user has no report at all for the given week
export type SubmissionStatusValue = 'SUBMITTED' | 'DRAFT' | 'MISSING'

// GET /dashboard/submission-status — one entry per team member for the current week
export type SubmissionStatusItem = {
  user: { id: string; name: string; email: string; role: Role }
  status: SubmissionStatusValue
  weekStart: string   // YYYY-MM-DD
}

// GET /dashboard/weekly-trends — one entry per week for the last N weeks
export type WeeklyTrendItem = {
  weekStart: string      // YYYY-MM-DD
  submitted: number      // number of submitted reports that week
  tasksCompleted: number // sum of non-empty lines in tasksCompleted across submitted reports
}

// GET /dashboard/workload — total submitted hours, grouped by project or user
export type WorkloadItem = {
  name: string          // project name or user name depending on groupBy
  color: string | null  // project hex colour; null when grouping by user
  totalHours: number
}

// GET /dashboard/activity-feed — latest N submitted reports with user + project
export type ActivityItem = Report & {
  user: { id: string; name: string; email: string }
  project: { id: string; name: string; color: string } | null
}
