import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  IoAnalyticsOutline,
  IoArchiveOutline,
  IoChatbubblesOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCodeSlashOutline,
  IoColorPaletteOutline,
  IoFolderOpenOutline,
  IoGridOutline,
  IoLayersOutline,
  IoLogOutOutline,
  IoMenuOutline,
  IoNotificationsOutline,
  IoPersonOutline,
  IoShieldOutline,
  IoTimeOutline,
  IoVideocamOutline,
} from 'react-icons/io5'
import { useAuthStore } from '../../stores/authStore'
import { useNotificaciones } from '../../hooks/useNotificaciones'
import { NotificacionesAlert } from '../notificaciones/NotificacionesAlert'
import { canAccessNavPath, isRestrictedRole } from '../../utils/roleAccess'
import { Avatar } from '../ui/Avatar'
import { Logo } from '../ui/Logo'
import { PinguinoPaseando } from '../ui/PinguinoPaseando'

const navItems = [
  { to: '/', label: 'Dashboard', icon: IoGridOutline, end: true },
  { to: '/proyectos', label: 'Proyectos', icon: IoFolderOpenOutline, end: true },
  { to: '/vista-global', label: 'Vista Global', icon: IoLayersOutline },
  { to: '/projects/admin', label: 'En espera', icon: IoTimeOutline },
  { to: '/proyectos/programador', label: 'Developers', icon: IoCodeSlashOutline },
  { to: '/proyectos/diseno', label: 'Diseñadores', icon: IoColorPaletteOutline },
  { to: '/proyectos-terminados', label: 'Finalizados', icon: IoCheckmarkCircleOutline },
  { to: '/analitica', label: 'Analítica', icon: IoAnalyticsOutline },
  { to: '/reuniones', label: 'Reuniones', icon: IoVideocamOutline },
  // Para administración es el panel de mensajes; para el equipo, el formulario.
  { to: '/notas', label: 'Mensajes', restrictedLabel: 'Dejar nota', icon: IoChatbubblesOutline },
  { to: '/usuarios', label: 'Usuarios', icon: IoPersonOutline },
  { to: '/roles', label: 'Roles', icon: IoShieldOutline },
  { to: '/archivados', label: 'Archivados', icon: IoArchiveOutline },
]

/** Campanita con el contador de no leídas. Va al lado del nombre del usuario. */
function CampanaNotificaciones({ noLeidas, onNavigate }: { noLeidas: number; onNavigate?: () => void }) {
  return (
    <NavLink
      to="/notificaciones"
      onClick={onNavigate}
      title="Notificaciones"
      aria-label={
        noLeidas > 0 ? `Notificaciones: ${noLeidas} sin leer` : 'Notificaciones'
      }
      className={({ isActive }) =>
        `relative shrink-0 rounded-lg p-2 transition-colors ${
          isActive
            ? 'bg-accent/20 text-accent-hover'
            : 'text-slate-400 hover:bg-surface-overlay hover:text-slate-200'
        }`
      }
    >
      <IoNotificationsOutline size={20} />
      {noLeidas > 0 && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] leading-4 font-semibold text-white">
          {noLeidas > 99 ? '99+' : noLeidas}
        </span>
      )}
    </NavLink>
  )
}

export function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const isFullWidthPage = ['/vista-global', '/proyectos', '/proyectos-terminados'].includes(
    location.pathname,
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const restricted = isRestrictedRole(user?.roleName)

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => canAccessNavPath(user?.roleName, item.to)),
    [user?.roleName],
  )

  const { nuevas, descartarNuevas, noLeidas } = useNotificaciones(user?.id)

  useEffect(() => {
    if (!sidebarOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-dvh">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-label="Cerrar menú"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface-raised transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
            <Logo size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-100">Websy Admin</p>
            <p className="truncate text-xs text-slate-400">Sistema de Proyectos</p>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-surface-overlay hover:text-slate-200 lg:hidden"
            aria-label="Cerrar menú"
          >
            <IoCloseOutline size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleNavItems.map(({ to, label, restrictedLabel, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/20 text-accent-hover'
                    : 'text-slate-400 hover:bg-surface-overlay hover:text-slate-200'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{restricted && restrictedLabel ? restrictedLabel : label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          {user && (
            <div className="mb-3 flex items-center gap-2.5">
              <Avatar userId={user.id} name={user.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-300">{user.name}</p>
                {user.roleName && (
                  <p className="truncate text-xs text-slate-500">{user.roleName}</p>
                )}
              </div>
              <CampanaNotificaciones noLeidas={noLeidas} onNavigate={closeSidebar} />
            </div>
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

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface-raised/95 px-4 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-surface-overlay hover:text-slate-100"
            aria-label="Abrir menú"
            aria-expanded={sidebarOpen}
          >
            <IoMenuOutline size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100">Websy Admin</p>
            {user?.name && (
              <p className="truncate text-xs text-slate-500">{user.name}</p>
            )}
          </div>
          <CampanaNotificaciones noLeidas={noLeidas} />
        </header>

        <main className="flex min-h-0 flex-1 flex-col">
          <div
            className={`mx-auto flex min-h-0 w-full flex-1 flex-col p-4 sm:p-6 lg:p-8 ${
              isFullWidthPage ? 'max-w-[100rem]' : 'max-w-7xl'
            }`}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {nuevas.length > 0 && (
        <NotificacionesAlert nuevas={nuevas} onDismiss={descartarNuevas} />
      )}

      <PinguinoPaseando />
    </div>
  )
}
