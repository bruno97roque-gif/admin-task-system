import { useState, type FormEvent } from 'react'
import { IoAddOutline, IoCloseOutline, IoMailOutline } from 'react-icons/io5'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'

/** El mismo tope que aplica el API. */
export const MAXIMO_INVITADOS_EXTERNOS = 20

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Correos de clientes para sumar a la invitación de Google Calendar. Se
 * edita sobre una copia y solo se aplica con «Listo», para que cerrar la
 * ventana no deje cambios a medias.
 *
 * Se monta fuera del formulario de la reunión: un `<form>` dentro de otro
 * no es válido y el Enter enviaría la reunión entera.
 */
export function InvitadosExternosModal({
  open,
  correos,
  onClose,
  onGuardar,
}: {
  open: boolean
  correos: string[]
  onClose: () => void
  onGuardar: (correos: string[]) => void
}) {
  if (!open) return null
  return <Contenido correos={correos} onClose={onClose} onGuardar={onGuardar} />
}

function Contenido({
  correos,
  onClose,
  onGuardar,
}: {
  correos: string[]
  onClose: () => void
  onGuardar: (correos: string[]) => void
}) {
  // Se monta al abrir, así que arranca siempre desde lo que tiene la reunión.
  const [lista, setLista] = useState(correos)
  const [nuevo, setNuevo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const lleno = lista.length >= MAXIMO_INVITADOS_EXTERNOS

  /** La lista más lo escrito en el campo, o `null` si hay algo inválido. */
  const combinar = (): string[] | null => {
    // Se aceptan varios pegados juntos, separados por coma, espacio o salto.
    const partes = nuevo
      .split(/[\s,;]+/)
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean)
    if (partes.length === 0) return lista

    const invalidos = partes.filter((c) => !CORREO_REGEX.test(c))
    if (invalidos.length > 0) {
      setError(`No es un correo válido: ${invalidos.join(', ')}`)
      return null
    }

    const siguiente = [...new Set([...lista, ...partes])]
    if (siguiente.length > MAXIMO_INVITADOS_EXTERNOS) {
      setError(`Como máximo ${MAXIMO_INVITADOS_EXTERNOS} correos por reunión`)
      return null
    }

    return siguiente
  }

  const agregar = (e: FormEvent) => {
    e.preventDefault()
    const siguiente = combinar()
    if (!siguiente) return
    setLista(siguiente)
    setNuevo('')
    setError(null)
  }

  // Lo escrito sin tocar «Agregar» también cuenta: sería raro perderlo.
  const listo = () => {
    const siguiente = combinar()
    if (!siguiente) return
    onGuardar(siguiente)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Invitar clientes" size="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Opcional. Estos correos reciben la invitación de Google Calendar con el link de Meet
          cuando la reunión se envía al Calendar. No necesitan cuenta en el sistema.
        </p>

        <form onSubmit={agregar} className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Input
              label="Correo del cliente"
              id="correo-invitado-externo"
              type="text"
              inputMode="email"
              autoComplete="off"
              placeholder="cliente@empresa.com"
              value={nuevo}
              disabled={lleno}
              error={error ?? undefined}
              onChange={(e) => {
                setNuevo(e.target.value)
                setError(null)
              }}
              autoFocus
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={lleno || !nuevo.trim()}
            className={error ? 'mb-6' : ''}
          >
            <IoAddOutline size={16} />
            Agregar
          </Button>
        </form>

        {lista.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-slate-500">
            Todavía no agregaste correos.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {lista.map((correo) => (
              <li
                key={correo}
                className="flex max-w-full items-center gap-1.5 rounded-full bg-surface-overlay py-1 pl-2.5 pr-1 text-sm text-slate-200"
              >
                <IoMailOutline size={14} className="shrink-0 text-slate-400" />
                <span className="truncate">{correo}</span>
                <button
                  type="button"
                  onClick={() => setLista(lista.filter((c) => c !== correo))}
                  aria-label={`Quitar ${correo}`}
                  className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-slate-600 hover:text-slate-100"
                >
                  <IoCloseOutline size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={listo}
          >
            Listo
          </Button>
        </div>
      </div>
    </Modal>
  )
}
