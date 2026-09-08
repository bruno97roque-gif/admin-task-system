import { useEffect, useState } from 'react'
import { IoCheckmarkDoneOutline, IoRefreshOutline } from 'react-icons/io5'
import type { Notificacion } from '../types'
import { useNotificacionesStore } from '../stores/notificacionesStore'
import { Button } from '../components/ui/Button'
import { NotificacionItem } from '../components/notificaciones/NotificacionItem'

export function NotificacionesPage() {
  const notificaciones = useNotificacionesStore((s) => s.notificaciones)
  const noLeidas = useNotificacionesStore((s) => s.noLeidas)
  const loading = useNotificacionesStore((s) => s.loading)
  const loaded = useNotificacionesStore((s) => s.loaded)
  const error = useNotificacionesStore((s) => s.error)
  const fetchNotificaciones = useNotificacionesStore((s) => s.fetchNotificaciones)
  const marcarLeida = useNotificacionesStore((s) => s.marcarLeida)
  const marcarTodasLeidas = useNotificacionesStore((s) => s.marcarTodasLeidas)

  const [soloNoLeidas, setSoloNoLeidas] = useState(false)

  useEffect(() => {
    if (!loaded) fetchNotificaciones()
  }, [loaded, fetchNotificaciones])

  const visibles = soloNoLeidas ? notificaciones.filter((n) => !n.leidaAt) : notificaciones

  const onClickItem = (n: Notificacion) => {
    if (!n.leidaAt) marcarLeida(n.id)
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Notificaciones</h1>
          <p className="text-sm text-slate-400">
            {noLeidas > 0
              ? `Tienes ${noLeidas} sin leer`
              : 'Estás al día'}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => fetchNotificaciones()}
            loading={loading}
          >
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => marcarTodasLeidas()}
            disabled={noLeidas === 0}
          >
            <IoCheckmarkDoneOutline size={18} />
            Marcar todas como leídas
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={soloNoLeidas}
            onChange={(e) => setSoloNoLeidas(e.target.checked)}
            className="rounded border-border bg-surface-raised accent-accent"
          />
          Solo no leídas
        </label>
      </div>

      <div className="space-y-3">
        {loading && notificaciones.length === 0 ? (
          <p className="py-12 text-center text-slate-500">Cargando notificaciones...</p>
        ) : visibles.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            {soloNoLeidas ? 'No tienes notificaciones sin leer' : 'Todavía no tienes notificaciones'}
          </p>
        ) : (
          visibles.map((n) => (
            <NotificacionItem key={n.id} notificacion={n} onClick={onClickItem} />
          ))
        )}
      </div>
    </div>
  )
}
