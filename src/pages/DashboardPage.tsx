import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import {
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
import { getEstadoProyectoLabel } from '../utils/projectStatus'
import { formatDateDisplay, formatDateTimeDisplay } from '../utils/date'
import { Avatar } from '../components/ui/Avatar'

const FINALIZED_STATUS = 'ProyectoFinalizado'

interface TeamColumnProps {
  title: string
  icon: typeof IoStatsChartOutline
  iconColor: string
  avatarBg: string
  avatarText: string
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
  roleLabel,
  items,
  emptyMessage,
  to,
}: TeamColumnProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          <Icon className={iconColor} size={16} />
          {title}
        </h3>
        <Link
          to={to}
          className="text-xs font-medium text-accent transition-colors hover:text-accent-hover"
        >
          Ver tablero →
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map(({ user, count }) => (
            <li
              key={user.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/30"
            >
              <Avatar
                userId={user.id}
                name={user.name}
                size={44}
                fallbackClassName={`${avatarBg} ${avatarText}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-bold tabular-nums text-slate-100">{count}</p>
                <p className="text-xs text-slate-500">
                  {count === 1 ? 'proyecto' : 'proyectos'}
                </p>
              </div>
            </li>
          ))}
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
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      to: '/proyectos/programador',
    },
    {
      label: 'En diseño',
      value: enDisenoCount,
      icon: IoColorPaletteOutline,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      to: '/proyectos/diseno',
    },
    {
      label: 'Proyectos activos',
      value: activeProjects.length,
      icon: IoFolderOpenOutline,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      to: '/proyectos',
    },
    {
      label: 'Reuniones',
      value: proximasReuniones.length,
      icon: IoVideocamOutline,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      to: '/reuniones',
    },
    {
      label: 'Finalizados',
      value: projects.filter((p) => isFinalized(p.estadoProyecto)).length,
      icon: IoCheckmarkCircleOutline,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
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
        {stats.map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link
            key={label}
            to={to}
            className="flex h-24 min-w-0 flex-col justify-between rounded-xl border border-border bg-surface-raised p-4 transition-colors hover:border-accent/50"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-sm text-slate-400">{label}</p>
              <div className={`shrink-0 rounded-lg p-2 ${bg}`}>
                <Icon className={color} size={22} />
              </div>
            </div>
            <p className="text-2xl leading-none font-bold text-slate-100">{value}</p>
          </Link>
        ))}
      </div>

      <section className="mb-6 shrink-0 rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
          <IoPeopleOutline className="text-accent" />
          Proyectos activos por miembro
        </h2>

        <div className="grid gap-8 lg:grid-cols-2">
          <TeamColumn
            title="Programadores"
            icon={IoStatsChartOutline}
            iconColor="text-purple-400"
            avatarBg="bg-purple-500/20"
            avatarText="text-purple-300"
            roleLabel="Programador"
            items={programadorCounts}
            emptyMessage="No hay programadores registrados"
            to="/proyectos/programador"
          />
          <TeamColumn
            title="Diseñadores"
            icon={IoColorPaletteOutline}
            iconColor="text-pink-400"
            avatarBg="bg-pink-500/20"
            avatarText="text-pink-300"
            roleLabel="Diseñador"
            items={disenadorCounts}
            emptyMessage="No hay diseñadores registrados"
            to="/proyectos/diseno"
          />
        </div>
      </section>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <IoFolderOpenOutline className="text-accent" />
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
                  className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{project.name}</p>
                    <p className="text-xs text-slate-500">Grupo {project.grupo}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-400">
                      {getEstadoProyectoLabel(project.estadoProyecto)}
                    </p>
                    <p className="text-xs text-slate-600">
                      {formatDateDisplay(project.updatedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border border-border bg-[#222034] p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <IoVideocamOutline className="text-emerald-400" />
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
            <ul className="min-h-0 space-y-3 overflow-y-auto">
              {proximasReuniones.slice(0, 5).map((reunion) => (
                <li
                  key={reunion.id}
                  className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{reunion.titulo}</p>
                    <p className="text-xs text-slate-500">
                      {formatDateTimeDisplay(reunion.fecha)}
                      {reunion.proyecto ? ` · ${reunion.proyecto.name}` : ''}
                    </p>
                  </div>
                  <a
                    href={reunion.linkMeet}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-medium text-emerald-400 hover:underline"
                  >
                    Unirse a Meet
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
