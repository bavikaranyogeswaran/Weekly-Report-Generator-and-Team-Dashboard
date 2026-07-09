import api from '@/lib/axios'
import type { Project } from '@/lib/types'

// GET /projects — returns all projects (used to populate report forms and the projects page)
export const getProjects = () =>
  api.get<Project[]>('/projects')

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
