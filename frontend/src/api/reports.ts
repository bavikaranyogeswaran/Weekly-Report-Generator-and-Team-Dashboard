import api from '@/lib/axios'
import type { Report, CreateReportDto, UpdateReportDto } from '@/lib/types'

// Optional filters for the reports list (managers can filter by userId/projectId/status/weekStart)
export type ReportFilters = {
  userId?: string
  projectId?: string
  status?: string
  weekStart?: string
}

// GET /reports — returns own reports for MEMBER; accepts filters for MANAGER
export const getReports = (filters?: ReportFilters) =>
  api.get<Report[]>('/reports', { params: filters })

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
