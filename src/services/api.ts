import type { AuthUser } from '../types'
import { apiFetch } from '../lib/api'

export interface LoginRequest {
  user: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export function loginRequest(credentials: LoginRequest) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function logoutRequest() {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
  })
}

export function getRolesRequest() {
  return apiFetch<import('../types').Role[]>('/rol')
}

export function createRoleRequest(data: { name: string }) {
  return apiFetch<import('../types').Role>('/rol', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getUsersRequest() {
  return apiFetch<import('../types').AppUser[]>('/user')
}

export interface CreateUserRequest {
  name: string
  user: string
  password: string
  roleId: number
}

export function createUserRequest(data: CreateUserRequest) {
  return apiFetch<import('../types').AppUser>('/user', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getProjectsRequest() {
  return apiFetch<import('../types').Project[]>('/projects')
}

export function getProjectsAdminRequest() {
  return apiFetch<import('../types').Project[]>('/projects/admin')
}

export function getProjectHistorialRequest(id: number) {
  return apiFetch<import('../types').HistorialEtapa[]>(`/projects/${id}/historial`)
}

export function getAnaliticaRequest() {
  return apiFetch<import('../types').Analitica>('/projects/analitica')
}

export function getProjectsByProgramadorRequest(programadorId?: number) {
  const query = programadorId != null ? `?id=${programadorId}` : ''
  return apiFetch<import('../types').Project[]>(`/projects/programador${query}`)
}

export function getProjectsByDisenoRequest(disenadorId?: number) {
  const query = disenadorId != null ? `?id=${disenadorId}` : ''
  return apiFetch<import('../types').Project[]>(`/projects/diseno${query}`)
}

export function getSeguimientosRequest() {
  return apiFetch<import('../types').Seguimiento[]>('/seguimiento')
}

export interface CreateProjectRequest {
  name: string
  descripcion: string
  grupo: string
  seguimientoId: number
  comentario: string
  tipoProyecto?: string | null
  disenadorId?: number | null
  desarrolladorId?: number | null
  usuariosIds?: number[]
}

export function createProjectRequest(data: CreateProjectRequest) {
  return apiFetch<import('../types').Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export interface UpdateProjectRequest {
  name: string
  descripcion: string
  grupo: string
  seguimientoId: number
  comentario: string
  tecnologia: string | null
  tipoProyecto: string | null
  estadoPago: string
  estadoProyecto: string
  diasSinResponder: number | null
  fechaEntrega: string | null
  disenadorId?: number | null
  desarrolladorId?: number | null
}

export interface UpdateProjectUsuariosRequest {
  usuariosIds: number[]
}

export function updateProjectRequest(id: number, data: UpdateProjectRequest) {
  return apiFetch<import('../types').Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteProjectRequest(id: number) {
  return apiFetch<void>(`/projects/${id}`, {
    method: 'DELETE',
  })
}

export interface UpdateProjectResponsablesRequest {
  disenadorId: number
  desarrolladorId: number
}

export function updateProjectResponsablesRequest(
  id: number,
  data: UpdateProjectResponsablesRequest,
) {
  return apiFetch<import('../types').Project>(`/projects/${id}/responsables`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function updateProjectUsuariosRequest(
  id: number,
  data: UpdateProjectUsuariosRequest,
) {
  return apiFetch<import('../types').Project>(`/projects/${id}/usuarios`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getRecordatoriosRequest() {
  return apiFetch<import('../types').Recordatorio[]>('/recordatorio')
}

export function getRecordatorioRequest(id: number) {
  return apiFetch<import('../types').Recordatorio>(`/recordatorio/${id}`)
}

export function createRecordatorioRequest(data: { descripcion: string }) {
  return apiFetch<import('../types').Recordatorio>('/recordatorio', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateRecordatorioRequest(
  id: number,
  data: { descripcion?: string; estado?: boolean },
) {
  return apiFetch<import('../types').Recordatorio>(`/recordatorio/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteRecordatorioRequest(id: number) {
  return apiFetch<void>(`/recordatorio/${id}`, {
    method: 'DELETE',
  })
}

export function updatePasswordRequest(id: number, password: string) {
  return apiFetch<void>(`/user/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  })
}
