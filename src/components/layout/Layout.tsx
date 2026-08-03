import { useMemo } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import {
  IoCalendarOutline,
  IoColorPaletteOutline,
  IoCodeSlashOutline,
  IoFolderOpenOutline,
  IoGridOutline,
  IoLayersOutline,
  IoLogOutOutline,
  IoPersonOutline,
  IoShieldOutline,
  IoStatsChartOutline,
} from 'react-icons/io5'
import { useAuthStore } from '../../stores/authStore'
import { useRecordatoriosReminders } from '../../hooks/useRecordatoriosReminders'
import { ReminderAlert } from '../reminders/ReminderAlert'
import { canAccessNavPath, isRestrictedRole } from '../../utils/roleAccess'

const navItems = [
  { to: '/', label: 'Dashboard', icon: IoGridOutline, end: true },
  { to: '/roles', label: 'Roles', icon: IoShieldOutline },
  { to: '/usuarios', label: 'Usuarios', icon: IoPersonOutline },
  { to: '/proyectos', label: 'Proyectos', icon: IoFolderOpenOutline },
  { to: '/projects/admin', label: 'Proyectos B y C', icon: IoLayersOutline },
  { to: '/proyectos/programador', label: 'Por programador', icon: IoStatsChartOutline },
  { to: '/proyectos/diseno', label: 'Diseño', icon: IoColorPaletteOutline },
  { to: '/recordatorios', label: 'Recordatorios', icon: IoCalendarOutline },
]

export function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => canAccessNavPath(user?.roleName, item.to)),
    [user?.roleName],
  )

  const showReminders = !isRestrictedRole(user?.roleName)
  const { showAlert, dismissAlert, goToRecordatorios } = useRecordatoriosReminders(showReminders)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-surface-raised">
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <IoCodeSlashOutline className="text-white" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">Websy Admin</p>
            <p className="text-xs text-slate-400">Sistema de Proyectos</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {visibleNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/20 text-accent-hover'
                    : 'text-slate-400 hover:bg-surface-overlay hover:text-slate-200'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 truncate text-sm text-slate-300">{user?.name}</div>
          {user?.roleName && (
            <div className="mb-3 truncate text-xs text-slate-500">{user.roleName}</div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-surface-overlay hover:text-red-400"
          >
            <IoLogOutOutline size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {showReminders && showAlert && (
        <ReminderAlert
          open={showAlert}
          onDismiss={dismissAlert}
          onGoToRecordatorios={goToRecordatorios}
        />
      )}
    </div>
  )
}
