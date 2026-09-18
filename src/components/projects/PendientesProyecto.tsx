import { useEffect, useState, type KeyboardEvent } from 'react'
import { IoAddOutline, IoCheckboxOutline, IoTrashOutline } from 'react-icons/io5'
import type { Pendiente } from '../../types'
import { clavePendientes, usePendientesStore } from '../../stores/pendientesStore'

const MAXIMO_TEXTO = 500

function Fila({ pendiente, editable }: { pendiente: Pendiente; editable: boolean }) {
  const actualizar = usePendientesStore((s) => s.actualizar)
  const borrar = usePendientesStore((s) => s.borrar)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(pendiente.texto)

  const guardarTexto = async () => {
    const limpio = texto.trim()
    setEditando(false)
    if (!limpio || limpio === pendiente.texto) {
      setTexto(pendiente.texto)
      return
    }
    await actualizar(pendiente, { texto: limpio })
  }

  const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
    // El modal es un formulario: Enter no tiene que guardar el proyecto.
    if (e.key === 'Enter') {
      e.preventDefault()
      void guardarTexto()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setTexto(pendiente.texto)
      setEditando(false)
    }
  }

  return (
    <li className="group flex items-start gap-2 rounded-md px-1 py-1 hover:bg-surface-overlay/40">
      <input
        type="checkbox"
        checked={pendiente.hecho}
        disabled={!editable}
        onChange={(e) => void actualizar(pendiente, { hecho: e.target.checked })}
        aria-label={pendiente.hecho ? 'Marcar como pendiente' : 'Marcar como hecho'}
        className="mt-0.5 shrink-0 rounded border-border bg-surface-raised accent-accent disabled:opacity-60"
      />
      {editando ? (
        <input
          type="text"
          value={texto}
          maxLength={MAXIMO_TEXTO}
          autoFocus
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => void guardarTexto()}
          onKeyDown={alTeclear}
          className="min-w-0 flex-1 rounded border border-accent bg-surface-raised px-1.5 py-0.5 text-sm text-slate-100"
        />
      ) : (
        <button
          type="button"
          disabled={!editable}
          onClick={() => setEditando(true)}
          title={editable ? 'Clic para editar' : undefined}
          className={`min-w-0 flex-1 break-words text-left text-sm ${
            pendiente.hecho ? 'text-slate-500 line-through' : 'text-slate-200'
          } ${editable ? 'cursor-text' : 'cursor-default'}`}
        >
          {pendiente.texto}
        </button>
      )}
      {editable && !editando && (
        <button
          type="button"
          onClick={() => void borrar(pendiente)}
          aria-label="Borrar pendiente"
          className="shrink-0 rounded p-0.5 text-slate-500 opacity-60 hover:text-red-400 group-hover:opacity-100"
        >
          <IoTrashOutline size={15} />
        </button>
      )}
    </li>
  )
}

/**
 * **PENDIENTES** de una persona en un proyecto. Si es la propia, se edita
 * (agregar con Enter, marcar, editar con un clic, borrar); si administración
 * mira la de otra persona, es solo lectura.
 */
export function PendientesProyecto({
  proyectoId,
  usuarioId,
  nombreDuenio,
  editable,
}: {
  proyectoId: number
  usuarioId: number
  /** Para el título cuando se mira la lista de otra persona. */
  nombreDuenio?: string
  editable: boolean
}) {
  const clave = clavePendientes(proyectoId, usuarioId)
  const lista = usePendientesStore((s) => s.listas[clave])
  const cargando = usePendientesStore((s) => s.cargando === clave)
  const fetchLista = usePendientesStore((s) => s.fetchLista)
  const crear = usePendientesStore((s) => s.crear)

  const [nuevo, setNuevo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)

  useEffect(() => {
    void fetchLista(proyectoId, usuarioId, editable).then((r) => {
      if (!r.success) setError(r.error ?? null)
    })
  }, [fetchLista, proyectoId, usuarioId, editable])

  const agregar = async () => {
    const texto = nuevo.trim()
    if (!texto || agregando) return
    setAgregando(true)
    const r = await crear(proyectoId, usuarioId, texto)
    setAgregando(false)
    if (r.success) {
      setNuevo('')
      setError(null)
    } else {
      setError(r.error ?? 'No se pudo agregar el pendiente')
    }
  }

  const hechos = lista?.filter((p) => p.hecho).length ?? 0
  const total = lista?.length ?? 0

  return (
    <section className="rounded-lg border border-border bg-surface p-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
          <IoCheckboxOutline size={16} className="text-accent-hover" />
          {editable ? 'Mis pendientes' : `Pendientes de ${nombreDuenio ?? 'esta persona'}`}
        </h3>
        {total > 0 && (
          <span className="text-xs text-slate-500">
            {hechos}/{total} hechos
          </span>
        )}
      </header>

      {error && <p className="mb-2 text-xs text-red-300">{error}</p>}

      {lista === undefined && cargando ? (
        <p className="py-2 text-xs text-slate-500">Cargando...</p>
      ) : total === 0 ? (
        <p className="py-1 text-xs text-slate-500">
          {editable ? 'Todavía no anotaste pendientes en este proyecto.' : 'No anotó pendientes.'}
        </p>
      ) : (
        <ul className="space-y-0.5">
          {lista?.map((p) => <Fila key={p.id} pendiente={p} editable={editable} />)}
        </ul>
      )}

      {editable && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={nuevo}
            maxLength={MAXIMO_TEXTO}
            placeholder="Agregar pendiente y Enter"
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => {
              // El modal es un formulario: Enter agrega, no guarda el proyecto.
              if (e.key === 'Enter') {
                e.preventDefault()
                void agregar()
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <button
            type="button"
            onClick={() => void agregar()}
            disabled={!nuevo.trim() || agregando}
            aria-label="Agregar pendiente"
            className="rounded-lg bg-accent p-1.5 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <IoAddOutline size={18} />
          </button>
        </div>
      )}
    </section>
  )
}
