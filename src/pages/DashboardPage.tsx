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
import {
  getActiveProjectCountsByRole,
  type UserProjectCount,
} from '../utils/assignableUsers'
import descansoGif from '../assets/descanso.gif'
import { estadoProyectoClass, getEstadoProyectoLabel } from '../utils/projectStatus'
import { Avatar } from '../components/ui/Avatar'

const FINALIZED_STATUS = 'ProyectoFinalizado'

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

interface TeamColumnProps {
  title: string
  icon: typeof IoStatsChartOutline
  iconColor: string
  avatarBg: string
  avatarText: string
  /** Color de la barra de avance (clase de fondo). */
  barColor: string
  roleLabel: string
  items: UserProjectCount[]
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
  roleLabel,
  items,
  emptyMessage,
  to,
}: TeamColumnProps) {
  // La barra es la parte de la carga de la columna que tiene cada persona.
  const total = items.reduce((suma, { count }) => suma + count, 0)

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
          {items.map(({ user, count }) => {
            const porcentaje = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <li
                key={user.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/30"
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
                <div className="w-[42%] shrink-0">
                  <p className="text-xs text-slate-400">
                    <span className="mr-1 text-lg font-bold tabular-nums text-slate-100">{count}</span>
                    {count === 1 ? 'proyecto' : 'proyectos'}
                  </p>
                  <div className="mt-1 flex items-center gap-3">
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-full bg-surface-overlay"
                      role="progressbar"
                      aria-valuenow={porcentaje}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${user.name}: ${porcentaje}% de los proyectos`}
                    >
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-xs tabular-nums text-slate-400">
                      {porcentaje}%
                    </span>
                  </div>
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

  const isFinalized = (estado: string) => estado === FINALIZED_STATUS

  const activeProjects = useMemo(
    () => projects.filter((p) => !isFinalized(p.estadoProyecto)),
    [projects],
  )

  const programadorCounts = useMemo(
    () => getActiveProjectCountsByRole(activeProjects, users, roles, 'Programador'),
    [activeProjects, users, roles],
  )

  const disenadorCounts = useMemo(
    () => getActiveProjectCountsByRole(activeProjects, users, roles, 'Diseñador'),
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
      value: projects.filter((p) => isFinalized(p.estadoProyecto)).length,
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
