import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import {
  IoArrowForwardOutline,
  IoCheckmarkCircleOutline,
  IoCodeSlashOutline,
  IoColorPaletteOutline,
  IoFolderOpenOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
  IoVideocamOutline,
} from 'react-icons/io5'
import { useProjectsStore } from '../stores/projectsStore'
import { useReunionesStore } from '../stores/reunionesStore'
import { useRolesStore } from '../stores/rolesStore'
import { useUsersStore } from '../stores/usersStore'
import { getUsersByRoleName, type AssignableRoleName } from '../utils/assignableUsers'
import { cargaDeMiembro, type CargaMiembro } from '../utils/cargaMiembro'
import type { AppUser, Project, Role } from '../types'
import descansoGif from '../assets/descanso.gif'
import { estadoProyectoClass, getEstadoProyectoLabel } from '../utils/projectStatus'
import { Avatar } from '../components/ui/Avatar'

/** Un proyecto entregado o archivado ya no está activo. */
const ESTADOS_CERRADOS = ['ProyectoFinalizado', 'Archivado']

/** `2026-09-21…` → `21/09/26`. */
function fechaCorta(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

/** `21/09/26 · 4:00 p. m.` */
function fechaHoraCorta(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const hora = d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' })
  return `${fechaCorta(value)} · ${hora}`
}

function VerTodos({ to, children = 'Ver todos' }: { to: string; children?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
    >
      {children}
      <IoArrowForwardOutline size={15} />
    </Link>
  )
}

/** Una persona de la columna, con sus proyectos ya repartidos por estado. */
interface MiembroConCarga {
  user: AppUser
  carga: CargaMiembro
}

/**
 * La gente de un puesto con sus proyectos repartidos entre lo que trabaja
 * hoy, lo que espera al cliente y lo que está en otra etapa. Más cargados
 * primero.
 */
function miembrosConCarga(
  activeProjects: Project[],
  users: AppUser[],
  roles: Role[],
  roleName: AssignableRoleName,
): MiembroConCarga[] {
  return getUsersByRoleName(users, roles, roleName)
    .map((user) => ({ user, carga: cargaDeMiembro(activeProjects, roleName, user.id) }))
    .sort((a, b) => b.carga.total - a.carga.total || a.user.name.localeCompare(b.user.name, 'es'))
}

interface TeamColumnProps {
  title: string
  icon: typeof IoStatsChartOutline
  iconColor: string
  avatarBg: string
  avatarText: string
  /** Color del tramo «en su etapa» de la barra (clase de fondo). */
  barColor: string
  /** Cómo se llama su etapa de trabajo: «en desarrollo», «en diseño». */
  etapaLabel: string
  /** Las etapas suyas anteriores a su trabajo; sin esto, el puesto no tiene. */
  previasLabel?: string
  /** Y cómo se llama cuando ya la cerró: «desarrollo terminado». */
  terminadoLabel: string
  roleLabel: string
  items: MiembroConCarga[]
  emptyMessage: string
  to: string
}

function TeamColumn({
  title,
  icon: Icon,
  iconColor,
  avatarBg,
  avatarText,
  barColor,
  etapaLabel,
  previasLabel,
  terminadoLabel,
  roleLabel,
  items,
  emptyMessage,
  to,
}: TeamColumnProps) {
  const total = items.reduce((suma, { carga }) => suma + carga.total, 0)

  return (
    <div className="min-w-0">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className={iconColor} size={24} />
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">{title}</h3>
            <p className="text-xs text-slate-500">
              {total} {total === 1 ? 'proyecto' : 'proyectos'}
            </p>
          </div>
        </div>
        <VerTodos to={to}>Ver tablero</VerTodos>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map(({ user, carga }) => {
            // Los tres tramos de la barra son los proyectos de esa persona:
            // el 100% es su carga, no la de la columna.
            const tramos = [
              ...(previasLabel
                ? [{ clave: 'previas', n: carga.previas, color: 'bg-teal-400', nombre: previasLabel }]
                : []),
              { clave: 'enCurso', n: carga.enCurso, color: barColor, nombre: etapaLabel },
              {
                clave: 'esperando',
                n: carga.esperando,
                color: 'bg-amber-400',
                nombre: `con el ${terminadoLabel}, esperando al cliente`,
              },
            ]
            const parte = (n: number) => (carga.total > 0 ? (n / carga.total) * 100 : 0)

            return (
              <li
                key={user.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/30"
              >
                <Avatar
                  userId={user.id}
                  name={user.name}
                  size={48}
                  fallbackClassName={`${avatarBg} ${avatarText}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
                  <p className="text-xs text-slate-500">{roleLabel}</p>
                </div>
                <div className="w-full shrink-0 sm:w-[46%]">
                  <p className="text-xs text-slate-400">
                    <span className="mr-1 text-lg font-bold tabular-nums text-slate-100">
                      {carga.total}
                    </span>
                    {carga.total === 1 ? 'proyecto' : 'proyectos'}
                  </p>
                  <div
                    className="mt-1.5 flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-overlay"
                    title={tramos.map((t) => `${t.n} ${t.nombre}`).join(' · ')}
                    aria-label={`${user.name}: ${tramos.map((t) => `${t.n} ${t.nombre}`).join(', ')}`}
                  >
                    {tramos
                      .filter((t) => t.n > 0)
                      .map((t) => (
                        <span
                          key={t.clave}
                          className={`h-full ${t.color}`}
                          style={{ width: `${parte(t.n)}%` }}
                        />
                      ))}
                  </div>
                  <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs whitespace-nowrap text-slate-400">
                    {previasLabel && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-teal-400" aria-hidden />
                        <span className="font-semibold tabular-nums text-slate-200">
                          {carga.previas}
                        </span>{' '}
                        {previasLabel}
                      </span>
                    )}
                    <span
                      className="flex items-center gap-1"
                      title={
                        carga.trabados > 0
                          ? `${carga.trabados} de esos están trabados por el cliente (Grupo B o C)`
                          : undefined
                      }
                    >
                      <span className={`h-2 w-2 rounded-sm ${barColor}`} aria-hidden />
                      <span className="font-semibold tabular-nums text-slate-200">
                        {carga.enCurso}
                      </span>{' '}
                      {etapaLabel}
                      {carga.trabados > 0 && (
                        <span className="text-amber-300">({carga.trabados} trabados)</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1" title={`Ya ${terminadoLabel}`}>
                      <span className="h-2 w-2 rounded-sm bg-amber-400" aria-hidden />
                      <span className="font-semibold tabular-nums text-slate-200">
                        {carga.esperando}
                      </span>{' '}
                      esperando al cliente
                    </span>
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function DashboardPage() {
  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const roles = useRolesStore((s) => s.roles)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)
  const projects = useProjectsStore((s) => s.projects)
  const fetchProjects = useProjectsStore((s) => s.fetchProjects)
  const reuniones = useReunionesStore((s) => s.reuniones)
  const reunionesCargadasEn = useReunionesStore((s) => s.cargadoEn)
  const fetchReuniones = useReunionesStore((s) => s.fetchReuniones)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchProjects()
    fetchReuniones(true)
  }, [fetchUsers, fetchRoles, fetchProjects, fetchReuniones])

  const activeProjects = useMemo(
    () => projects.filter((p) => !ESTADOS_CERRADOS.includes(p.estadoProyecto)),
    [projects],
  )

  const programadorCounts = useMemo(
    () => miembrosConCarga(activeProjects, users, roles, 'Programador'),
    [activeProjects, users, roles],
  )

  const disenadorCounts = useMemo(
    () => miembrosConCarga(activeProjects, users, roles, 'Diseñador'),
    [activeProjects, users, roles],
  )

  // Una reunión sigue siendo «próxima» hasta una hora después de su inicio.
  const proximasReuniones = useMemo(() => {
    const limite = reunionesCargadasEn - 60 * 60 * 1000
    return reuniones
      .filter((r) => new Date(r.fecha).getTime() >= limite)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  }, [reuniones, reunionesCargadasEn])

  const enDesarrolloCount = useMemo(
    () => projects.filter((p) => p.estadoProyecto === 'Desarrollo').length,
    [projects],
  )

  const enDisenoCount = useMemo(
    () =>
      projects.filter((p) => p.estadoProyecto === 'Diseno' || p.estadoProyecto === 'AvanceDiseno')
        .length,
    [projects],
  )

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [projects],
  )

  const stats = [
    {
      label: 'En desarrollo',
      value: enDesarrolloCount,
      icon: IoCodeSlashOutline,
      color: 'text-violet-300',
      to: '/proyectos/programador',
    },
    {
      label: 'En diseño',
      value: enDisenoCount,
      icon: IoColorPaletteOutline,
      color: 'text-pink-400',
      to: '/proyectos/diseno',
    },
    {
      label: 'Proyectos activos',
      value: activeProjects.length,
      icon: IoFolderOpenOutline,
      color: 'text-violet-200',
      to: '/proyectos',
      destacado: true,
    },
    {
      label: 'Reuniones',
      value: proximasReuniones.length,
      icon: IoVideocamOutline,
      color: 'text-teal-300',
      to: '/reuniones',
    },
    {
      label: 'Finalizados',
      value: projects.filter((p) => p.estadoProyecto === 'ProyectoFinalizado').length,
      icon: IoCheckmarkCircleOutline,
      color: 'text-teal-300',
      to: '/proyectos-terminados',
    },
  ]

  return (
    // En escritorio con altura suficiente (1080p y más) el dashboard entra
    // completo en la pantalla: altura fija (100dvh menos el padding del
    // layout) y la fila de abajo absorbe lo que sobra, con scroll interno en
    // sus listas si hiciera falta. En pantallas más bajas fluye normal.
    <div className="flex flex-col lg:[@media(min-height:900px)]:h-[calc(100dvh-4rem)]">
      <header className="mb-4 sm:mb-6">
        <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-slate-400">
          Resumen general del sistema de proyectos
        </p>
      </header>

      <div className="mb-6 grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, color, to, destacado }) => (
          <Link
            key={label}
            to={to}
            className={`flex h-24 min-w-0 flex-col justify-between rounded-xl border p-4 transition-colors sm:h-28 sm:p-5 ${
              destacado
                ? 'border-violet-400/50 bg-violet-500/15 hover:border-violet-300/70'
                : 'border-border bg-surface-raised hover:border-accent/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={`min-w-0 truncate text-sm ${destacado ? 'text-violet-100' : 'text-slate-300'}`}>
                {label}
              </p>
              <Icon className={`shrink-0 ${color}`} size={26} />
            </div>
            <p className="text-3xl leading-none font-bold text-slate-100">{value}</p>
          </Link>
        ))}
      </div>

      <section className="mb-6 shrink-0 rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="mb-5 flex items-center gap-3 text-lg font-semibold text-slate-100">
          <IoPeopleOutline className="text-accent" size={24} />
          Proyectos activos por miembro
        </h2>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-border">
          <div className="lg:pr-8">
            <TeamColumn
              title="Programadores"
              icon={IoStatsChartOutline}
              iconColor="text-violet-400"
              avatarBg="bg-purple-500/20"
              avatarText="text-purple-300"
              barColor="bg-violet-400"
              etapaLabel="en desarrollo"
              previasLabel="en brief o taxonomía"
              terminadoLabel="desarrollo terminado"
              roleLabel="Programador"
              items={programadorCounts}
              emptyMessage="No hay programadores registrados"
              to="/proyectos/programador"
            />
          </div>
          <div className="lg:pl-8">
            <TeamColumn
              title="Diseñadores"
              icon={IoColorPaletteOutline}
              iconColor="text-pink-400"
              avatarBg="bg-pink-500/20"
              avatarText="text-pink-300"
              barColor="bg-pink-400"
              etapaLabel="en diseño"
              terminadoLabel="diseño terminado"
              roleLabel="Diseñador"
              items={disenadorCounts}
              emptyMessage="No hay diseñadores registrados"
              to="/proyectos/diseno"
            />
          </div>
        </div>
      </section>

      {/* Mínimo de alto: con muchos miembros arriba, esta fila no se aplasta; la página hace scroll. */}
      <div className="grid min-h-0 flex-1 gap-6 lg:min-h-[22rem] lg:grid-cols-2">
        <section className="flex min-h-0 flex-col rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-100">
            <IoFolderOpenOutline className="text-accent" size={24} />
            Proyectos recientes
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Los últimos que se agregaron o modificaron (nuevo proyecto, cambio de etapa, edición...)
          </p>
          {projects.length === 0 ? (
            <p className="text-sm text-slate-500">No hay proyectos registrados</p>
          ) : (
            <ul className="min-h-0 space-y-2 overflow-y-auto">
              {recentProjects.map((project) => (
                <li
                  key={project.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{project.name}</p>
                    <p className="text-xs text-slate-500">Grupo {project.grupo}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-md px-3 py-1 text-xs font-medium ${estadoProyectoClass(project.estadoProyecto)}`}
                    >
                      {getEstadoProyectoLabel(project.estadoProyecto)}
                    </span>
                    <span className="w-16 text-right text-xs tabular-nums text-slate-400">
                      {fechaCorta(project.updatedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto shrink-0 pt-4">
            <VerTodos to="/proyectos" />
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-100">
            <IoVideocamOutline className="text-teal-300" size={24} />
            Próximas reuniones
          </h2>
          <p className="mb-4 text-xs text-slate-500">Las cinco más cercanas, con su link de Meet</p>
          {proximasReuniones.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
              <img
                src={descansoGif}
                alt=""
                draggable={false}
                className="min-h-0 w-auto max-w-64 flex-1 rounded-lg object-contain select-none"
              />
              <p className="text-sm text-slate-500">No hay reuniones agendadas</p>
              <Link to="/reuniones" className="text-sm text-accent-hover hover:underline">
                Agendar una
              </Link>
            </div>
          ) : (
            <ul className="min-h-0 space-y-2 overflow-y-auto">
              {proximasReuniones.slice(0, 5).map((reunion) => (
                <li
                  key={reunion.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{reunion.titulo}</p>
                    <p className="truncate text-xs text-slate-500">
                      {fechaHoraCorta(reunion.fecha)}
                      {reunion.proyecto ? ` · ${reunion.proyecto.name}` : ''}
                    </p>
                  </div>
                  {reunion.linkMeet ? (
                    <a
                      href={reunion.linkMeet}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-teal-500/10 px-3 py-1.5 text-sm font-semibold text-teal-300 transition-colors hover:bg-teal-500/20 sm:self-auto"
                    >
                      <IoVideocamOutline size={18} />
                      Unirse
                    </a>
                  ) : (
                    <span className="shrink-0 self-start rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 sm:self-auto">
                      Falta el link
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto shrink-0 pt-4">
            <VerTodos to="/reuniones" />
          </div>
        </section>
      </div>
    </div>
  )
}
