import type { AuthUser } from '../types'
import { apiFetch } from '../lib/api'

export interface LoginRequest {
  user: string
  password: string
}

/**
 * Entrar. Lo atiende better-auth: si sale bien deja la cookie de sesión y el
 * resto de los datos se piden a `/perfil`.
 */
export function loginRequest(credentials: LoginRequest) {
  return apiFetch<{ token: string }>('/api/auth/sign-in/username', {
    method: 'POST',
    body: JSON.stringify({
      username: credentials.user,
      password: credentials.password,
      rememberMe: true,
    }),
  })
}

/** Salir: better-auth borra la sesión en la base y la cookie. */
export function logoutRequest() {
  return apiFetch<void>('/api/auth/sign-out', {
    method: 'POST',
    body: '{}',
  })
}

/** Avisa a administración que alguien olvidó su contraseña. Pública. */
export function recuperarContrasenaRequest(usuario: string) {
  return apiFetch<{ message: string }>('/auth/recuperar-contrasena', {
    method: 'POST',
    body: JSON.stringify({ usuario }),
  })
}

/** El usuario de la sesión actual, con su rol y su foto. */
export function getSesionRequest() {
  return apiFetch<AuthUser>('/perfil')
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
  email?: string | null
}

export function updateUserEmailRequest(id: number, email: string | null) {
  return apiFetch<import('../types').AppUser>(`/user/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ email }),
  })
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
  enlaceMateriales?: string | null
  fechaEntregaDiseno?: string | null
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
  enlaceMateriales?: string | null
  diasSinResponder: number | null
  fechaEntrega: string | null
  fechaEntregaDiseno?: string | null
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

export function getArchivedProjectsRequest() {
  return apiFetch<import('../types').ProjectArchivado[]>('/projects/archivados')
}

export function archivarProjectRequest(id: number, motivo?: string) {
  return apiFetch<import('../types').Project>(`/projects/${id}/archivar`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  })
}

export interface ResumenReactivacion {
  porcentajeAReactivar: number
  diasArchivado: number
  seRehaceInicioYDiseno: boolean
  proyecto: import('../types').Project
}

export function reactivarProjectRequest(id: number, motivo?: string) {
  return apiFetch<ResumenReactivacion>(`/projects/${id}/reactivar`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
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

export function updatePasswordRequest(id: number, password: string) {
  return apiFetch<import('../types').AppUser>(`/user/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  })
}

// --- Mi perfil -------------------------------------------------------------

export function getPerfilRequest() {
  return apiFetch<import('../types').Perfil>('/perfil')
}

export function actualizarPerfilRequest(data: { name: string }) {
  return apiFetch<import('../types').Perfil>('/perfil', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function cambiarContrasenaRequest(data: { actual: string; nueva: string }) {
  return apiFetch<void>('/perfil/contrasena', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/** `imagen` es un data URL, ya recortado y achicado en el navegador. */
export function subirFotoRequest(imagen: string) {
  return apiFetch<import('../types').Perfil>('/perfil/foto', {
    method: 'PUT',
    body: JSON.stringify({ imagen }),
  })
}

export function borrarFotoRequest() {
  return apiFetch<import('../types').Perfil>('/perfil/foto', { method: 'DELETE' })
}

// --- Comunicados -----------------------------------------------------------

export interface ComunicadoRequest {
  titulo: string
  mensaje: string
  nivel: import('../types').NivelComunicado
  enLogin: boolean
  enSistema: boolean
  desde?: string
  hasta?: string | null
  /** Solo al publicar: deja una notificación a todos. */
  notificar?: boolean
}

/** Pública: la usa la página de login. */
export function getComunicadosLoginRequest() {
  return apiFetch<import('../types').Comunicado[]>('/comunicados/login')
}

export function getComunicadosActivosRequest() {
  return apiFetch<import('../types').Comunicado[]>('/comunicados/activos')
}

export function cerrarComunicadoRequest(id: number) {
  return apiFetch<void>(`/comunicados/${id}/cerrar`, { method: 'POST' })
}

export function getComunicadosRequest() {
  return apiFetch<import('../types').ComunicadoAdmin[]>('/comunicados')
}

export function createComunicadoRequest(data: ComunicadoRequest) {
  return apiFetch<import('../types').ComunicadoAdmin>('/comunicados', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateComunicadoRequest(id: number, data: Omit<ComunicadoRequest, 'notificar'>) {
  return apiFetch<import('../types').ComunicadoAdmin>(`/comunicados/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function finalizarComunicadoRequest(id: number) {
  return apiFetch<import('../types').ComunicadoAdmin>(`/comunicados/${id}/finalizar`, {
    method: 'POST',
  })
}

export function deleteComunicadoRequest(id: number) {
  return apiFetch<void>(`/comunicados/${id}`, { method: 'DELETE' })
}

// --- Notificaciones -------------------------------------------------------

export function getNotificacionesRequest() {
  return apiFetch<import('../types').BandejaNotificaciones>('/notificaciones')
}

export function marcarNotificacionLeidaRequest(id: number) {
  return apiFetch<import('../types').Notificacion>(`/notificaciones/${id}/leer`, {
    method: 'PATCH',
  })
}

export function marcarTodasLeidasRequest() {
  return apiFetch<{ marcadas: number }>('/notificaciones/leer-todas', {
    method: 'POST',
  })
}

// --- Reuniones ------------------------------------------------------------

export interface ReunionRequest {
  titulo: string
  descripcion?: string | null
  fecha: string
  /** Lo genera Google al enviarla al Calendar; el formulario ya no lo pide. */
  linkMeet?: string
  proyectoId?: number | null
  participantesIds: number[]
  /** Correos de clientes para la invitación de Google. */
  invitadosExternos?: string[]
  /** Grabar y transcribir el Meet; pesa al enviarla al Calendar. */
  grabarReunion?: boolean
}

export function getReunionesRequest() {
  return apiFetch<import('../types').Reunion[]>('/reuniones')
}

export function getMisReunionesRequest() {
  return apiFetch<import('../types').Reunion[]>('/reuniones/mias')
}

export function createReunionRequest(data: ReunionRequest) {
  return apiFetch<import('../types').Reunion>('/reuniones', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateReunionRequest(id: number, data: Partial<ReunionRequest>) {
  return apiFetch<
    import('../types').Reunion & { google?: import('../types').SincronizacionGoogle }
  >(`/reuniones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteReunionRequest(id: number) {
  return apiFetch<import('../types').Reunion>(`/reuniones/${id}`, {
    method: 'DELETE',
  })
}

/** Crea el evento en Google Calendar con Meet. Solo administración. */
export function enviarAlCalendarRequest(id: number) {
  return apiFetch<
    import('../types').Reunion & {
      grabacion: import('../types').EstadoDeGrabacion
      detalleGrabacion?: string
    }
  >(`/reuniones/${id}/enviar-calendar`, { method: 'POST' })
}

/** Reaplica la grabación y devuelve lo que Google tiene guardado. Solo administración. */
export function revisarGrabacionRequest(id: number) {
  return apiFetch<import('../types').RevisionDeGrabacion>(
    `/reuniones/${id}/revisar-grabacion`,
    { method: 'POST' },
  )
}

// --- Integración con Google (solo administración) -------------------------

export function getEstadoGoogleRequest() {
  return apiFetch<import('../types').EstadoGoogle>('/integraciones/google/estado')
}

/** Devuelve la URL de Google a la que hay que llevar al navegador. */
export function conectarGoogleRequest() {
  return apiFetch<{ url: string }>('/integraciones/google/conexion', { method: 'POST' })
}

export function desconectarGoogleRequest() {
  return apiFetch<void>('/integraciones/google', { method: 'DELETE' })
}

// --- Notas a administración -----------------------------------------------

export interface ConsultaNotas {
  pagina?: number
  porPagina?: number
  abiertos?: boolean
  estado?: string
}

function queryNotas(consulta: ConsultaNotas): string {
  const params = new URLSearchParams()
  if (consulta.pagina) params.set('pagina', String(consulta.pagina))
  if (consulta.porPagina) params.set('porPagina', String(consulta.porPagina))
  if (consulta.abiertos) params.set('abiertos', 'true')
  if (consulta.estado) params.set('estado', consulta.estado)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function getNotasRequest(consulta: ConsultaNotas = {}) {
  return apiFetch<import('../types').PaginaNotas>(`/notas${queryNotas(consulta)}`)
}

export function getMisNotasRequest(consulta: ConsultaNotas = {}) {
  return apiFetch<import('../types').PaginaNotas>(
    `/notas/mias${queryNotas(consulta)}`,
  )
}

export function createNotaRequest(data: {
  proyectoId: number
  contenido: string
  categoria?: string
}) {
  return apiFetch<import('../types').NotaAdmin>('/notas', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function responderNotaRequest(id: number, contenido: string) {
  return apiFetch<import('../types').NotaAdmin>(`/notas/${id}/respuestas`, {
    method: 'POST',
    body: JSON.stringify({ contenido }),
  })
}

export function cambiarEstadoNotaRequest(id: number, estado: string) {
  return apiFetch<import('../types').NotaAdmin>(`/notas/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}

export function marcarNotaLeidaRequest(id: number) {
  return apiFetch<import('../types').NotaAdmin>(`/notas/${id}/leer`, {
    method: 'PATCH',
  })
}

export function deleteNotaRequest(id: number) {
  return apiFetch<import('../types').NotaAdmin>(`/notas/${id}`, {
    method: 'DELETE',
  })
}
