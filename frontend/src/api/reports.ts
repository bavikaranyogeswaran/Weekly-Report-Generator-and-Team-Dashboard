import api from '@/lib/axios'
import type { Report, CreateReportDto, UpdateReportDto, PaginatedResult } from '@/lib/types'

// Optional filters for the reports list (managers can filter by userId/projectId/status/date range)
export type ReportFilters = {
  userId?: string
  projectId?: string
  status?: string
  weekStartFrom?: string  // inclusive lower bound — weeks starting on or after this date
  weekStartTo?: string    // inclusive upper bound — weeks starting on or before this date
  page?: number
  limit?: number
}

// GET /reports — returns own reports for MEMBER; accepts filters for MANAGER; always paginated
export const getReports = (filters?: ReportFilters) =>
  api.get<PaginatedResult<Report>>('/reports', { params: filters })

// GET /reports/:id
export const getReport = (id: string) =>
  api.get<Report>(`/reports/${id}`)

// POST /reports — creates a new DRAFT report
export const createReport = (data: CreateReportDto) =>
  api.post<Report>('/reports', data)

// PATCH /reports/:id — updates a DRAFT report (only allowed while status is DRAFT)
export const updateReport = (id: string, data: UpdateReportDto) =>
  api.patch<Report>(`/reports/${id}`, data)

// POST /reports/:id/submit — transitions DRAFT → SUBMITTED
export const submitReport = (id: string) =>
  api.post<Report>(`/reports/${id}/submit`)

// DELETE /reports/:id — only allowed while status is DRAFT
export const deleteReport = (id: string) =>
  api.delete<void>(`/reports/${id}`)
