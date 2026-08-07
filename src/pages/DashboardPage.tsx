import { useEffect } from 'react'
import { Link } from 'react-router'
import {
  IoAlarmOutline,
  IoCheckmarkCircleOutline,
  IoFolderOpenOutline,
  IoPeopleOutline,
  IoShieldOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import { useProjectsStore } from '../stores/projectsStore'
import { useRecordatoriosStore } from '../stores/recordatoriosStore'
import { useRolesStore } from '../stores/rolesStore'
import { useUsersStore } from '../stores/usersStore'

const FINALIZED_STATUS = 'ProyectoFinalizado'

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

  const activeProjects = projects.filter((p) => !isFinalized(p.estadoProyecto))
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
                  <span className="shrink-0 text-xs text-slate-400">{project.estadoProyecto}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
            <IoTimeOutline className="text-amber-400" />
            Recordatorios activos
          </h2>
          {pendingRecordatorios.length === 0 ? (
            <p className="text-sm text-slate-500">No hay recordatorios activos</p>
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
