export interface Seguimiento {
  id: number
  name: string
}

export interface ProjectUsuarioAssignment {
  usuario: AppUser
}

export interface Project {
  id: number
  name: string
  estadoPago: string
  estadoProyecto: string
  descripcion: string
  tecnologia: string | null
  tipoProyecto: string | null
  grupo: string
  seguimientoId: number
  comentario: string
  diasSinResponder: number | null
  fechaEntrega: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  seguimiento: Seguimiento
  usuarios: (ProjectUsuarioAssignment | AppUser)[]
  desarrolladorId: number | null
  disenadorId: number | null
  desarrollador: AppUser | null
  disenador: AppUser | null
  archivadoAt: string | null
}

/** Un proyecto archivado, con la etapa en la que estaba justo antes de archivarse. */
export interface ProjectArchivado extends Project {
  etapaAlArchivar: string | null
}

export interface Recordatorio {
  id: number
  descripcion: string
  estado: boolean
}

export interface Role {
  id: number
  name: string
}

export interface AuthUser {
  id: number
  name: string
  user: string
  roleId: number
  roleName: string
}

export interface AppUser {
  id: number
  name: string
  user: string
  active: boolean
  roleId: number
}

export interface HistorialEtapa {
  id: number
  proyectoId: number
  estadoAnterior: string | null
  estadoNuevo: string
  grupoAnterior: string | null
  grupoNuevo: string
  motivo: string | null
  usuarioId: number | null
  createdAt: string
  usuario: { id: number; name: string; user: string } | null
}

export interface AnaliticaMes {
  mes: string
  disenosFinalizados: number
  desarrollosFinalizados: number
}

export interface AnaliticaPersonaMes {
  usuarioId: number
  nombre: string
  mes: string
  cantidad: number
}

export interface AnaliticaProyectoDuracion {
  proyectoId: number
  nombre: string
  dias: number
}

export interface AnaliticaDuracion {
  etapa: 'Diseno' | 'Desarrollo'
  promedioDias: number
  cantidadProyectos: number
  proyectos: AnaliticaProyectoDuracion[]
}

export interface Analitica {
  porMes: AnaliticaMes[]
  disenadoresPorMes: AnaliticaPersonaMes[]
  desarrolladoresPorMes: AnaliticaPersonaMes[]
  duracionPromedio: AnaliticaDuracion[]
}
