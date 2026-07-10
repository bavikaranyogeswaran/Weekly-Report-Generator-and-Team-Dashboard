import api from '@/lib/axios'
import type { Project } from '@/lib/types'

// GET /projects — returns all projects (used to populate the projects management page)
export const getProjects = () =>
  api.get<Project[]>('/projects')

// GET /projects?mine=true — returns only the projects the current user is assigned to
// (used to populate the report form's project dropdown)
export const getMyProjects = () =>
  api.get<Project[]>('/projects', { params: { mine: true } })

// GET /projects/:id — returns a single project with its members
export const getProject = (id: string) =>
  api.get<Project>(`/projects/${id}`)

// POST /projects — manager creates a new project (name required; description and color optional)
export const createProject = (dto: { name: string; description?: string; color?: string }) =>
  api.post<Project>('/projects', dto)

// PATCH /projects/:id — manager updates project fields (all fields optional)
export const updateProject = (id: string, dto: { name?: string; description?: string; color?: string }) =>
  api.patch<Project>(`/projects/${id}`, dto)

// DELETE /projects/:id — manager permanently removes a project
export const deleteProject = (id: string) =>
  api.delete<{ message: string }>(`/projects/${id}`)

// POST /projects/:id/members — manager assigns a user to the project; returns the updated project
export const addProjectMember = (projectId: string, userId: string) =>
  api.post<Project>(`/projects/${projectId}/members`, { userId })

// DELETE /projects/:id/members/:userId — manager removes a user from the project
export const removeProjectMember = (projectId: string, userId: string) =>
  api.delete<Project>(`/projects/${projectId}/members/${userId}`)
