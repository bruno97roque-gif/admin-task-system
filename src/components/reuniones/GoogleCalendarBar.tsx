import { useState } from 'react'
import { IoLogoGoogle, IoWarningOutline } from 'react-icons/io5'
import type { EstadoGoogle } from '../../types'
import { useReunionesStore } from '../../stores/reunionesStore'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'

/**
 * La conexión con la cuenta de Google de Websy. Solo la ve administración:
 * es la que tiene Workspace y la que envía las reuniones al Calendar.
 */
export function GoogleCalendarBar({ google }: { google: EstadoGoogle }) {
  const conectarGoogle = useReunionesStore((s) => s.conectarGoogle)
  const desconectarGoogle = useReunionesStore((s) => s.desconectarGoogle)

  const [conectando, setConectando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [desconectando, setDesconectando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const conectar = async () => {
    setConectando(true)
    setError(null)
    const result = await conectarGoogle()
    if (result.success && result.url) {
      // Se va a Google y vuelve a /reuniones con el resultado en la URL.
      window.location.assign(result.url)
      return
    }
    setConectando(false)
    setError(result.error ?? 'No se pudo conectar Google')
  }

  const desconectar = async () => {
    setDesconectando(true)
    const result = await desconectarGoogle()
    setDesconectando(false)
    if (result.success) {
      setConfirmar(false)
      setError(null)
    } else {
      setError(result.error ?? 'No se pudo desconectar Google')
    }
  }

  if (!google.configurada) {
    return (
      <p className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <IoLogoGoogle size={14} className="shrink-0" />
        La conexión con Google Calendar no está configurada en el servidor: las reuniones se
        pasan a Calendar a mano.
      </p>
    )
  }

  const faltanPermisos = google.conectada && google.permisosFaltantes.length > 0

  return (
    <div className="mb-4 rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <IoLogoGoogle
            size={18}
            className={`mt-0.5 shrink-0 ${google.conectada ? 'text-emerald-400' : 'text-slate-500'}`}
          />
          {google.conectada ? (
            <p className="min-w-0 text-slate-300">
              Google Calendar conectado con{' '}
              <span className="break-all font-medium text-slate-100">{google.cuenta}</span>
              {google.conectadaPor && (
                <span className="text-slate-500"> · lo conectó {google.conectadaPor}</span>
              )}
            </p>
          ) : (
            <p className="text-slate-300">
              Conecta la cuenta de Google de Websy para enviar las reuniones al Calendar: Google
              genera el Meet, manda las invitaciones y deja activadas la grabación y la
              transcripción.
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {google.conectada ? (
            <>
              {faltanPermisos && (
                <Button className="w-full sm:w-auto" onClick={conectar} loading={conectando}>
                  Reconectar
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => setConfirmar(true)}
              >
                Desconectar
              </Button>
            </>
          ) : (
            <Button className="w-full sm:w-auto" onClick={conectar} loading={conectando}>
              <IoLogoGoogle size={16} />
              Conectar Google
            </Button>
          )}
        </div>
      </div>

      {faltanPermisos && (
        <p className="mt-2 flex items-start gap-2 text-xs text-amber-300">
          <IoWarningOutline size={14} className="mt-px shrink-0" />
          Al conectar no se marcaron todos los permisos. Reconecta y deja todas las casillas
          activadas, o no se podrá crear el evento o configurar la grabación.
        </p>
      )}
      {error && !confirmar && <p className="mt-2 text-xs text-red-300">{error}</p>}

      <ConfirmDialog
        open={confirmar}
        title="Desconectar Google"
        message="Las reuniones ya enviadas siguen en Google Calendar, pero el sistema no podrá crear, actualizar ni cancelar eventos hasta que vuelvas a conectar la cuenta."
        confirmLabel="Desconectar"
        loading={desconectando}
        error={error}
        onConfirm={desconectar}
        onCancel={() => {
          setConfirmar(false)
          setError(null)
        }}
      />
    </div>
  )
}
