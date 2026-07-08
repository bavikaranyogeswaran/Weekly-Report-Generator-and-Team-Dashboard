import api from '@/lib/axios'
import type { Project } from '@/lib/types'

// GET /projects — returns all projects (used to populate the project select in report forms)
export const getProjects = () =>
  api.get<Project[]>('/projects')

// GET /projects/:id — returns a single project with its members
export const getProject = (id: string) =>
  api.get<Project>(`/projects/${id}`)
