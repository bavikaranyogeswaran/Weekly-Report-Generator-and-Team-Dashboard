// Shared TypeScript types used across the frontend

// Mirrors the Role enum from the backend
export type Role = 'MEMBER' | 'MANAGER' | 'ADMIN'

// Shape of the authenticated user returned by GET /auth/me
export type AuthUser = {
  id: string
  name: string
  email: string
  role: Role
  isVerified: boolean
  createdAt: string
}

// Mirrors the ReportStatus enum from the backend
export type ReportStatus = 'DRAFT' | 'SUBMITTED'

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
  project?: { id: string; name: string } | null
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
  createdAt: string
}

// ── Dashboard types (manager only) ──────────────────────────────────────────

// GET /dashboard/summary — four headline numbers for the top stat tiles
export type DashboardSummary = {
  totalUsers: number
  totalProjects: number
  submittedThisWeek: number
  submissionRate: number   // 0–100 percentage
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
  weekStart: string   // YYYY-MM-DD
  submitted: number
}

// GET /dashboard/workload — total submitted hours per team member
export type WorkloadItem = {
  user: { id: string; name: string; email: string }
  totalHours: number
}

// GET /dashboard/activity-feed — latest N submitted reports with user + project
export type ActivityItem = Report & {
  user: { id: string; name: string; email: string }
  project: { id: string; name: string } | null
}
