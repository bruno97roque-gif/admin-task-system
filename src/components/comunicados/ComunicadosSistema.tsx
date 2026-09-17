import { useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useComunicadosStore } from '../../stores/comunicadosStore'
import { ComunicadoAviso } from './ComunicadoAviso'

/** Cada cuánto se buscan comunicados nuevos. No hace falta más seguido. */
const INTERVALO_MS = 2 * 60 * 1000

/**
 * Los comunicados vigentes, arriba de cada página. Cada persona puede cerrar
 * los que no son urgentes y no le vuelven a salir.
 */
export function ComunicadosSistema() {
  const usuarioId = useAuthStore((s) => s.user?.id)
  const activos = useComunicadosStore((s) => s.activos)
  const cerrandoId = useComunicadosStore((s) => s.cerrandoId)
  const fetchActivos = useComunicadosStore((s) => s.fetchActivos)
  const cerrar = useComunicadosStore((s) => s.cerrar)

  useEffect(() => {
    if (usuarioId === undefined) return
    fetchActivos()
    const intervalo = window.setInterval(fetchActivos, INTERVALO_MS)
    return () => window.clearInterval(intervalo)
  }, [usuarioId, fetchActivos])

  if (activos.length === 0) return null

  return (
    <div className="mb-4 space-y-2">
      {activos.map((c) => (
        <ComunicadoAviso
          key={c.id}
          comunicado={c}
          cerrando={cerrandoId === c.id}
          onCerrar={() => cerrar(c.id)}
        />
      ))}
    </div>
  )
}
