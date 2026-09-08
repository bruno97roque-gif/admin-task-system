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
  /** Carpeta de Drive con todo el material del proyecto. */
  enlaceMateriales: string | null
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
  /** Correo corporativo, para las invitaciones de calendario. */
  email?: string | null
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

export interface AnaliticaProyectoMovimiento {
  proyectoId: number
  nombre: string
  fecha: string
  /** Solo en las salidas: si se cerró bien o se archivó. */
  motivo?: 'ProyectoFinalizado' | 'Archivado'
}

/** Altas y cierres de un mes, con el detalle de qué proyectos fueron. */
export interface AnaliticaFlujoMes {
  mes: string
  entraron: number
  salieron: number
  neto: number
  entrantes: AnaliticaProyectoMovimiento[]
  salientes: AnaliticaProyectoMovimiento[]
}

export interface Analitica {
  flujoMensual: AnaliticaFlujoMes[]
  porMes: AnaliticaMes[]
  disenadoresPorMes: AnaliticaPersonaMes[]
  desarrolladoresPorMes: AnaliticaPersonaMes[]
  duracionPromedio: AnaliticaDuracion[]
}

/** Usuario tal como viene anidado en reuniones, notas y notificaciones. */
export interface UsuarioResumen {
  id: number
  name: string
  user: string
  roleId: number
  email?: string | null
}

export interface ProyectoResumen {
  id: number
  name: string
}

export type TipoNotificacion =
  | 'ProyectoAsignado'
  | 'EtapaFinalizada'
  | 'ReunionProgramada'
  | 'NotaRecibida'

export interface Notificacion {
  id: number
  usuarioId: number
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  proyectoId: number | null
  proyecto: ProyectoResumen | null
  leidaAt: string | null
  createdAt: string
}

export interface BandejaNotificaciones {
  noLeidas: number
  notificaciones: Notificacion[]
}

export interface Reunion {
  id: number
  titulo: string
  descripcion: string | null
  fecha: string
  linkMeet: string
  proyectoId: number | null
  proyecto: ProyectoResumen | null
  creadorId: number | null
  creador: UsuarioResumen | null
  participantes: UsuarioResumen[]
  createdAt: string
  updatedAt: string
}

export interface NotaAdmin {
  id: number
  proyectoId: number
  proyecto: ProyectoResumen
  autorId: number | null
  autor: UsuarioResumen | null
  contenido: string
  leidaAt: string | null
  createdAt: string
}
