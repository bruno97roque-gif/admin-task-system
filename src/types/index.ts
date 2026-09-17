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
  /** Compromiso de entrega del diseño, aparte de la entrega final. */
  fechaEntregaDiseno: string | null
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
  /** Correo corporativo; con él se arma el acceso al webmail. */
  email?: string | null
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
  /** Cerrados bien: son un logro, no una baja. */
  finalizados: number
  /** Archivados sin terminar: acá sí se perdió al cliente. */
  archivados: number
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
  | 'ReunionProxima'
  | 'NotaRecibida'
  | 'NotaRespondida'

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

/** Una página de la bandeja de tickets. */
export interface PaginaNotas {
  items: NotaAdmin[]
  total: number
  pagina: number
  porPagina: number
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
  /** Cadena vacía mientras no haya link. */
  linkMeet: string
  /** Si el Meet arranca grabando y transcribiendo. */
  grabarReunion: boolean
  /** Correos de clientes que se suman a la invitación de Google. */
  invitadosExternos: string[]
  /** Id del evento en Google Calendar; `null` mientras no se envió. */
  googleEventId: string | null
  enviadaAt: string | null
  proyectoId: number | null
  proyecto: ProyectoResumen | null
  creadorId: number | null
  creador: UsuarioResumen | null
  participantes: UsuarioResumen[]
  createdAt: string
  updatedAt: string
}

/** Cómo quedó el evento de Google después de editar una reunión que ya estaba allá. */
export type SincronizacionGoogle = 'actualizada' | 'sin_cambios' | 'error'

/** Qué pasó con la grabación al enviar una reunión al Calendar. */
export type EstadoDeGrabacion =
  | 'activada'
  | 'parcial'
  | 'desactivada'
  | 'no_disponible'
  | 'sin_meet'

/** Cómo tiene Google cada artefacto automático de un Meet. */
export type Automatico = 'ON' | 'OFF' | 'SIN_DEFINIR'

/** Resultado de revisar la grabación de una reunión ya enviada. */
export interface RevisionDeGrabacion {
  grabacion: EstadoDeGrabacion
  /** El motivo que dio Google cuando algo no se pudo aplicar. */
  detalleGrabacion?: string
  /** Lo que Google tiene guardado; `null` si no se pudo leer. */
  enGoogle: { grabacion: Automatico; transcripcion: Automatico; notasDeGemini: Automatico } | null
}

/** La cuenta de Google de Websy, conectada por administración. */
export interface EstadoGoogle {
  /** Si el servidor tiene las variables de Google cargadas. */
  configurada: boolean
  conectada: boolean
  cuenta: string | null
  conectadaPor: string | null
  conectadaAt: string | null
  /** Permisos que la cuenta no concedió: con alguno faltando hay que reconectar. */
  permisosFaltantes: string[]
}

export type EstadoNota ='Pendiente' | 'EnCurso' | 'Resuelta'

export type CategoriaNota = 'Consulta' | 'Bloqueo' | 'Material' | 'Cambio' | 'Otro'

export interface RespuestaNota {
  id: number
  autorId: number | null
  autor: UsuarioResumen | null
  contenido: string
  createdAt: string
}

/** Un ticket del equipo para administración, con su hilo de respuestas. */
export interface NotaAdmin {
  id: number
  proyectoId: number
  proyecto: ProyectoResumen
  autorId: number | null
  autor: UsuarioResumen | null
  contenido: string
  estado: EstadoNota
  categoria: CategoriaNota
  respuestas: RespuestaNota[]
  ultimaRespuestaAt: string | null
  leidaAt: string | null
  createdAt: string
}
