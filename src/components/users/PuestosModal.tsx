import { useState } from 'react'
import { IoCodeSlashOutline, IoColorPaletteOutline } from 'react-icons/io5'
import type { AppUser, Puesto } from '../../types'
import { puestosDe } from '../../utils/roleAccess'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

const OPCIONES: { puesto: Puesto; titulo: string; detalle: string; icono: typeof IoCodeSlashOutline }[] =
  [
    {
      puesto: 'Diseno',
      titulo: 'Diseño',
      detalle: 'Aparece en el tablero de Diseñadores y como diseñador de un proyecto.',
      icono: IoColorPaletteOutline,
    },
    {
      puesto: 'Desarrollo',
      titulo: 'Desarrollo',
      detalle: 'Aparece en Developers y como desarrollador de un proyecto.',
      icono: IoCodeSlashOutline,
    },
  ]

/**
 * En qué trabaja una persona. El rol decide permisos; el puesto decide dónde
 * aparece, así que alguien puede diseñar y desarrollar a la vez.
 */
export function PuestosModal({
  usuario,
  rolNombre,
  guardando,
  onGuardar,
  onClose,
}: {
  usuario: AppUser
  rolNombre?: string
  guardando: boolean
  onGuardar: (puestos: Puesto[]) => Promise<{ success: boolean; error?: string }>
  onClose: () => void
}) {
  const [elegidos, setElegidos] = useState<Puesto[]>(() =>
    puestosDe(rolNombre, usuario.puestos),
  )
  const [error, setError] = useState<string | null>(null)

  const alternar = (puesto: Puesto) =>
    setElegidos((actuales) =>
      actuales.includes(puesto)
        ? actuales.filter((p) => p !== puesto)
        : [...actuales, puesto],
    )

  const guardar = async () => {
    if (elegidos.length === 0) {
      setError('Elige al menos un puesto')
      return
    }
    const r = await onGuardar(elegidos)
    if (r.success) onClose()
    else setError(r.error ?? 'No se pudieron guardar los puestos')
  }

  return (
    <Modal open onClose={onClose} title={`Puestos de ${usuario.name}`} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Su rol es <span className="text-slate-200">{rolNombre ?? '—'}</span> y eso no
          cambia: el rol decide qué permisos tiene. El puesto decide en qué tablero
          aparece y a qué proyectos se le puede asignar.
        </p>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <ul className="space-y-2">
          {OPCIONES.map(({ puesto, titulo, detalle, icono: Icono }) => {
            const activo = elegidos.includes(puesto)
            return (
              <li key={puesto}>
                <button
                  type="button"
                  onClick={() => alternar(puesto)}
                  aria-pressed={activo}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                    activo
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-surface hover:border-accent/40'
                  }`}
                >
                  <Icono
                    size={20}
                    className={`mt-0.5 shrink-0 ${activo ? 'text-accent-hover' : 'text-slate-500'}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-100">{titulo}</span>
                    <span className="block text-xs text-slate-500">{detalle}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={activo}
                    readOnly
                    tabIndex={-1}
                    className="mt-1 shrink-0 rounded border-border bg-surface-raised accent-accent"
                  />
                </button>
              </li>
            )
          })}
        </ul>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="w-full sm:w-auto" loading={guardando} onClick={() => void guardar()}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
