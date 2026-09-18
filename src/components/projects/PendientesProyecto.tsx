import { useEffect, useState, type KeyboardEvent } from 'react'
import {
  IoAddOutline,
  IoCheckboxOutline,
  IoChevronForwardOutline,
  IoClose,
  IoTrashOutline,
} from 'react-icons/io5'
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
 * El botón del modal del proyecto que abre el panel de pendientes, con el
 * avance de la lista a la vista.
 */
export function BotonPendientes({
  proyectoId,
  usuarioId,
  editable,
  abierto,
  onClick,
}: {
  proyectoId: number
  usuarioId: number
  editable: boolean
  abierto: boolean
  onClick: () => void
}) {
  const resumen = usePendientesStore((s) => s.resumen[clavePendientes(proyectoId, usuarioId)])
  const total = resumen?.total ?? 0
  const hechos = resumen?.hechos ?? 0

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={abierto}
      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        abierto
          ? 'border-accent bg-accent/15 text-accent-hover'
          : 'border-border bg-surface text-slate-200 hover:border-accent/50'
      }`}
    >
      <IoCheckboxOutline size={17} className="text-accent-hover" />
      <span className="flex-1 text-left">{editable ? 'Mis pendientes' : 'Pendientes'}</span>
      {total > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            hechos === total ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-200'
          }`}
        >
          {hechos}/{total}
        </span>
      )}
      <IoChevronForwardOutline
        size={16}
        className={`text-slate-500 transition-transform ${abierto ? 'rotate-180' : ''}`}
      />
    </button>
  )
}

/**
 * **PENDIENTES** de una persona en un proyecto, en un panel al costado del
 * modal (en celular, una hoja que sube encima). Si es la propia, se edita (agregar con Enter, marcar, editar con un
 * clic, borrar); si administración mira la de otra persona, es solo lectura.
 */
export function PendientesProyecto({
  proyectoId,
  usuarioId,
  nombreDuenio,
  editable,
  onClose,
}: {
  proyectoId: number
  usuarioId: number
  /** Para el título cuando se mira la lista de otra persona. */
  nombreDuenio?: string
  editable: boolean
  onClose: () => void
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
    <section
      aria-label="Pendientes"
      className="fixed inset-x-0 bottom-0 z-10 flex max-h-[80dvh] flex-col rounded-t-xl border border-border bg-surface-raised shadow-2xl sm:static sm:max-h-[calc(100dvh-2rem)] sm:w-80 sm:shrink-0 sm:rounded-xl"
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
            <IoCheckboxOutline size={16} className="text-accent-hover" />
            <span className="truncate">
              {editable ? 'Mis pendientes' : `Pendientes de ${nombreDuenio ?? 'esta persona'}`}
            </span>
          </h3>
          {total > 0 && (
            <p className="mt-0.5 text-xs text-slate-500">
              {hechos}/{total} hechos
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar pendientes"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-surface-overlay hover:text-slate-100"
        >
          <IoClose size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
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
      </div>

      {editable && (
        <div className="flex shrink-0 items-center gap-2 border-t border-border p-3">
          <input
            type="text"
            value={nuevo}
            maxLength={MAXIMO_TEXTO}
            autoFocus
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
