import type { Project, Reunion, UsuarioResumen } from '../types'
import { esEtapaDeDiseno, type EstadoProyecto } from './projectStatus'
import { isProjectAssignee } from './projectUsers'
import { esAdministracion } from './roleAccess'

/**
 * Tipos de reunión. Arman el título junto con el proyecto, que va primero:
 * «056 - Perforaciones H&A — Diseño».
 *
 * `Equipo` es el caso aparte: no lleva proyecto y el título es fijo, para
 * agendar rápido una reunión general.
 */
export const TIPOS_REUNION = [
  { value: 'Brief', label: 'Brief' },
  { value: 'Diseno', label: 'Diseño' },
  { value: 'Desarrollo', label: 'Desarrollo' },
  { value: 'Presentacion', label: 'Presentación' },
  { value: 'Otros', label: 'Otros' },
  { value: 'Equipo', label: 'Reunión de equipo' },
] as const

export type TipoReunion = (typeof TIPOS_REUNION)[number]['value']

/** Sin proyecto ni tipo en el título: se agenda rápido. */
export const esReunionDeEquipo = (tipo: string) => tipo === 'Equipo'

/** Con «Otros» el título lo escribe quien agenda. */
export const tituloEsLibre = (tipo: string) => tipo === 'Otros' || tipo === 'Equipo'

export function componerTitulo(tipo: string, nombreProyecto: string | undefined): string {
  if (esReunionDeEquipo(tipo)) return 'Reunión de equipo'
  if (!nombreProyecto) return ''

  const etiqueta = TIPOS_REUNION.find((t) => t.value === tipo)?.label
  return etiqueta && tipo !== 'Otros' ? `${nombreProyecto} — ${etiqueta}` : nombreProyecto
}

function aFormatoCalendar(fecha: Date): string {
  // Google Calendar espera UTC compacto: 20260910T150000Z
  return fecha.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Cuánto dura una reunión por defecto al pasarla a Google Calendar. */
const DURACION_MINUTOS = 60

/**
 * Enlace que abre Google Calendar con el evento prellenado: título, horario,
 * descripción con el link de Meet e invitados por correo. No crea nada por sí
 * solo — quien agenda confirma en Calendar, y ahí salen las invitaciones.
 *
 * Los participantes sin correo cargado no se pueden invitar; el formulario
 * avisa cuáles son.
 */
export function enlaceGoogleCalendar(reunion: {
  titulo: string
  descripcion?: string | null
  fecha: string
  linkMeet: string
  participantes: Pick<UsuarioResumen, 'email'>[]
}): string {
  const inicio = new Date(reunion.fecha)
  const fin = new Date(inicio.getTime() + DURACION_MINUTOS * 60 * 1000)

  const detalles = [reunion.descripcion?.trim(), `Meet: ${reunion.linkMeet}`]
    .filter(Boolean)
    .join('\n\n')

  const invitados = reunion.participantes
    .map((p) => p.email)
    .filter((email): email is string => Boolean(email))

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: reunion.titulo,
    dates: `${aFormatoCalendar(inicio)}/${aFormatoCalendar(fin)}`,
    details: detalles,
    location: reunion.linkMeet,
  })

  if (invitados.length > 0) params.set('add', invitados.join(','))

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Convocados que no tienen correo cargado, por eso no se los puede invitar. */
export function participantesSinCorreo(reunion: Pick<Reunion, 'participantes'>): string[] {
  return reunion.participantes.filter((p) => !p.email).map((p) => p.name)
}

/**
 * Sobre qué proyectos puede agendar cada quien. Es la misma regla que aplica
 * el API (`quien-agenda.reglas.ts`), replicada acá para no ofrecer en el
 * selector un proyecto que después va a dar 403.
 *
 * El diseñador, sobre los suyos mientras sean cosa de diseño; el
 * desarrollador, sobre los suyos en cualquier etapa; administración, sobre
 * todos.
 */
export function proyectosAgendables(
  proyectos: Project[],
  roleName: string | null | undefined,
  usuarioId: number | null | undefined,
): Project[] {
  const activos = proyectos.filter((p) => !p.deletedAt)

  if (esAdministracion(roleName ?? undefined)) return activos
  if (usuarioId == null) return []

  if (roleName === 'Diseñador') {
    return activos.filter(
      (p) =>
        p.disenadorId === usuarioId &&
        esEtapaDeDiseno(p.estadoProyecto as EstadoProyecto),
    )
  }

  if (roleName === 'Programador') {
    return activos.filter((p) => isProjectAssignee(p, 'Programador', usuarioId))
  }

  // Cualquier otro rol: mientras figure en el proyecto de alguna forma.
  return activos.filter(
    (p) =>
      isProjectAssignee(p, 'Programador', usuarioId) ||
      isProjectAssignee(p, 'Diseñador', usuarioId),
  )
}
