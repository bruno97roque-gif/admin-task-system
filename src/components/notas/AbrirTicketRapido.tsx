import { useState } from 'react'
import { Link } from 'react-router'
import {
  IoCheckmarkCircleOutline,
  IoChatbubbleEllipsesOutline,
  IoSendOutline,
} from 'react-icons/io5'
import { useNotasStore } from '../../stores/notasStore'
import { CATEGORIA_OPTIONS } from '../../utils/notas'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

/**
 * Abrir un ticket sin salir del proyecto que se está mirando. Va dentro del
 * modal de edición de los tableros: ahí la persona ya eligió el proyecto, así
 * que no se le vuelve a preguntar.
 *
 * Arranca plegado para no competir con el formulario de edición.
 */
export function AbrirTicketRapido({
  proyectoId,
  nombreProyecto,
}: {
  proyectoId: number
  nombreProyecto: string
}) {
  const createNota = useNotasStore((s) => s.createNota)
  const saving = useNotasStore((s) => s.saving)

  const [abierto, setAbierto] = useState(false)
  const [categoria, setCategoria] = useState('Consulta')
  const [contenido, setContenido] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async () => {
    const texto = contenido.trim()
    if (!texto) {
      setError('Escribe el mensaje')
      return
    }

    const result = await createNota({ proyectoId, contenido: texto, categoria })

    if (result.success) {
      setContenido('')
      setError(null)
      setEnviado(true)
      setAbierto(false)
    } else {
      setError(result.error ?? 'No se pudo abrir el ticket')
    }
  }

  if (enviado && !abierto) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
        <IoCheckmarkCircleOutline size={18} className="shrink-0" />
        Ticket enviado. Administración ya fue notificada.
        <Link to="/notas" className="ml-auto text-xs font-medium underline">
          Ver mis tickets
        </Link>
      </div>
    )
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        // Mismo estilo que «Abrir materiales en Drive»: los dos accesos rápidos
        // del modal van juntos y ninguno compite con «Guardar».
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 text-sm font-medium text-accent-hover transition-colors hover:bg-accent/20"
      >
        <IoChatbubbleEllipsesOutline size={16} />
        Abrir un ticket sobre este proyecto
      </button>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
      <p className="text-xs text-slate-500">
        Le llega a administración con el proyecto «{nombreProyecto}» ya cargado.
      </p>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <Select
        label="Tipo"
        options={CATEGORIA_OPTIONS}
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
      />

      <Textarea
        label="Mensaje"
        placeholder="¿Qué necesitas contarle a administración?"
        rows={3}
        maxLength={2000}
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => {
            setAbierto(false)
            setError(null)
          }}
        >
          Cancelar
        </Button>
        {/* type="button": está dentro del form de edición del proyecto y no
            tiene que dispararlo al enviar. */}
        <Button type="button" className="w-full sm:w-auto" onClick={enviar} loading={saving}>
          <IoSendOutline size={15} />
          Enviar ticket
        </Button>
      </div>
    </div>
  )
}
