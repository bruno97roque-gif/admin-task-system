import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import {
  IoAlarmOutline,
  IoCheckmarkCircleOutline,
  IoColorPaletteOutline,
  IoFolderOpenOutline,
  IoPeopleOutline,
  IoShieldOutline,
  IoStatsChartOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import { useProjectsStore } from '../stores/projectsStore'
import { useRecordatoriosStore } from '../stores/recordatoriosStore'
import { useRolesStore } from '../stores/rolesStore'
import { useUsersStore } from '../stores/usersStore'
import {
  getActiveProjectCountsByRole,
  type UserProjectCount,
} from '../utils/assignableUsers'
import descansoGif from '../assets/descanso.gif'
import { getEstadoProyectoLabel } from '../utils/projectStatus'
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
  const recordatorios = useRecordatoriosStore((s) => s.recordatorios)
  const fetchRecordatorios = useRecordatoriosStore((s) => s.fetchRecordatorios)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchProjects()
    fetchRecordatorios()
  }, [fetchUsers, fetchRoles, fetchProjects, fetchRecordatorios])

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

  const pendingRecordatorios = recordatorios.filter((r) => r.estado)

  const stats = [
    {
      label: 'Usuarios',
      value: users.length,
      icon: IoPeopleOutline,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      to: '/usuarios',
    },
    {
      label: 'Roles',
      value: roles.length,
      icon: IoShieldOutline,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      to: '/roles',
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
      label: 'Recordatorios activos',
      value: pendingRecordatorios.length,
      icon: IoAlarmOutline,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      to: '/recordatorios',
    },
    {
      label: 'Proyectos finalizados',
      value: projects.filter((p) => isFinalized(p.estadoProyecto)).length,
      icon: IoCheckmarkCircleOutline,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      to: '/proyectos',
    },
  ]

  return (
    <div>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-slate-400">
          Resumen general del sistema de proyectos
        </p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link
            key={label}
            to={to}
            className="rounded-xl border border-border bg-surface-raised p-5 transition-colors hover:border-accent/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-100">{value}</p>
              </div>
              <div className={`rounded-xl p-3 ${bg}`}>
                <Icon className={color} size={24} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="mb-8 rounded-xl border border-border bg-surface-raised p-5 sm:p-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-100">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
            <IoFolderOpenOutline className="text-accent" />
            Proyectos recientes
          </h2>
          {projects.length === 0 ? (
            <p className="text-sm text-slate-500">No hay proyectos registrados</p>
          ) : (
            <ul className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <li
                  key={project.id}
                  className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{project.name}</p>
                    <p className="text-xs text-slate-500">Grupo {project.grupo}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {getEstadoProyectoLabel(project.estadoProyecto)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col rounded-xl border border-border bg-[#222034] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
            <IoTimeOutline className="text-amber-400" />
            Recordatorios activos
          </h2>
          {pendingRecordatorios.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <img
                src={descansoGif}
                alt=""
                draggable={false}
                className="h-64 w-64 rounded-lg object-cover select-none"
              />
              <p className="text-sm text-slate-500">No hay recordatorios activos</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pendingRecordatorios.slice(0, 5).map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-border bg-surface px-3 py-2.5"
                >
                  <p className="line-clamp-2 text-sm font-medium text-slate-200">
                    {item.descripcion}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
