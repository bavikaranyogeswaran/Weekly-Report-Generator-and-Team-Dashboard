import api from '@/lib/axios'
import type {
  DashboardSummary,
  SubmissionStatusItem,
  WeeklyTrendItem,
  WorkloadItem,
  ActivityItem,
} from '@/lib/types'

// GET /dashboard/summary — four headline numbers (total users, projects, etc.)
export const getDashboardSummary = () =>
  api.get<DashboardSummary>('/dashboard/summary')

// GET /dashboard/submission-status — per-member status for the given week
// weekStart defaults to the current week on the backend when omitted
export const getSubmissionStatus = (weekStart?: string) =>
  api.get<SubmissionStatusItem[]>('/dashboard/submission-status', {
    params: weekStart ? { weekStart } : undefined,
  })

// GET /dashboard/weekly-trends — submitted-report counts for the last N weeks
export const getWeeklyTrends = (weeks = 8) =>
  api.get<WeeklyTrendItem[]>('/dashboard/weekly-trends', { params: { weeks } })

// GET /dashboard/workload — total hours logged per team member
export const getWorkload = () =>
  api.get<WorkloadItem[]>('/dashboard/workload')

// GET /dashboard/activity-feed — latest submitted reports with user + project
export const getActivityFeed = (limit = 10) =>
  api.get<ActivityItem[]>('/dashboard/activity-feed', { params: { limit } })
