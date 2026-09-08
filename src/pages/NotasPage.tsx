import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  IoChatbubbleEllipsesOutline,
  IoCheckmarkCircleOutline,
  IoRefreshOutline,
  IoSendOutline,
  IoTrashOutline,
} from 'react-icons/io5'
import type { EstadoNota, NotaAdmin } from '../types'
import { useAuthStore } from '../stores/authStore'
import { useNotasStore } from '../stores/notasStore'
import { useProjectsStore } from '../stores/projectsStore'
import { isRestrictedRole } from '../utils/roleAccess'
import { isProjectAssignee } from '../utils/projectUsers'
import { formatRelativeTime } from '../utils/date'
import {
  CATEGORIA_OPTIONS,
  colorCategoria,
  colorEstado,
  ESTADO_OPTIONS,
  etiquetaCategoria,
  etiquetaEstado,
} from '../utils/notas'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'

interface NotaForm {
  proyectoId: string
  categoria: string
  contenido: string
}

const emptyForm: NotaForm = { proyectoId: '', categoria: 'Consulta', contenido: '' }

/** Un ticket con su hilo, la caja para responder y el cambio de estado. */
function TicketCard({
  nota,
  esAdmin,
  saving,
  onResponder,
  onCambiarEstado,
  onDelete,
}: {
  nota: NotaAdmin
  esAdmin: boolean
  saving: boolean
  onResponder: (id: number, texto: string) => Promise<void>
  onCambiarEstado: (id: number, estado: EstadoNota) => void
  onDelete: (nota: NotaAdmin) => void
}) {
  const [respuesta, setRespuesta] = useState('')
  const [abierto, setAbierto] = useState(false)

  const resuelto = nota.estado === 'Resuelta'
  const hayHilo = nota.respuestas.length > 0
  const verHilo = abierto || !resuelto

  const enviar = async () => {
    const texto = respuesta.trim()
    if (!texto) return
    await onResponder(nota.id, texto)
    setRespuesta('')
  }

  return (
    <article
      className={`rounded-xl border p-4 ${
        resuelto ? 'border-border/60 bg-surface-raised/60' : 'border-border bg-surface-raised'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorCategoria(nota.categoria)}`}
        >
          {etiquetaCategoria(nota.categoria)}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${colorEstado(nota.estado)}`}>
          {etiquetaEstado(nota.estado)}
        </span>
        <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-slate-200">
          {nota.proyecto.name}
        </span>
        {esAdmin && nota.autor && (
          <span className="flex items-center gap-1.5 text-sm text-slate-300">
            <Avatar userId={nota.autor.id} name={nota.autor.name} size={22} />
            {nota.autor.name}
          </span>
        )}
        <span className="text-xs text-slate-500">{formatRelativeTime(nota.createdAt)}</span>

        <div className="ml-auto flex items-center gap-2">
          {esAdmin && (
            <>
              <div className="w-36">
                <Select
                  label=""
                  aria-label="Estado del ticket"
                  options={ESTADO_OPTIONS}
                  value={nota.estado}
                  onChange={(e) => onCambiarEstado(nota.id, e.target.value as EstadoNota)}
                  className="py-1"
                />
              </div>
              <Button
                variant="ghost"
                className="hover:text-red-400"
                onClick={() => onDelete(nota)}
                aria-label="Eliminar"
              >
                <IoTrashOutline size={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-200">
        {nota.contenido}
      </p>

      {hayHilo && resuelto && !abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-3 text-xs font-medium text-accent-hover hover:underline"
        >
          Ver las {nota.respuestas.length} respuestas
        </button>
      )}

      {verHilo && hayHilo && (
        <ul className="mt-3 space-y-2 border-l-2 border-border pl-3">
          {nota.respuestas.map((r) => (
            <li key={r.id} className="rounded-lg bg-surface px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                {r.autor && <Avatar userId={r.autor.id} name={r.autor.name} size={20} />}
                <span className="text-xs font-medium text-slate-300">
                  {r.autor?.name ?? 'Usuario eliminado'}
                </span>
                <span className="text-xs text-slate-600">
                  {formatRelativeTime(r.createdAt)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-300">
                {r.contenido}
              </p>
            </li>
          ))}
        </ul>
      )}

      {resuelto ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
          <IoCheckmarkCircleOutline size={14} />
          Resuelto. {esAdmin ? 'Cámbialo a «En curso» para seguir la conversación.' : ''}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                enviar()
              }
            }}
            placeholder="Escribe una respuesta..."
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <Button onClick={enviar} loading={saving} disabled={!respuesta.trim()}>
            <IoSendOutline size={15} />
            Responder
          </Button>
        </div>
      )}
    </article>
  )
}

export function NotasPage() {
  const user = useAuthStore((s) => s.user)
  const esAdmin = !isRestrictedRole(user?.roleName)

  const notas = useNotasStore((s) => s.notas)
  const loading = useNotasStore((s) => s.loading)
  const saving = useNotasStore((s) => s.saving)
  const error = useNotasStore((s) => s.error)
  const fetchNotas = useNotasStore((s) => s.fetchNotas)
  const createNota = useNotasStore((s) => s.createNota)
  const responder = useNotasStore((s) => s.responder)
  const cambiarEstado = useNotasStore((s) => s.cambiarEstado)
  const deleteNota = useNotasStore((s) => s.deleteNota)

  const projects = useProjectsStore((s) => s.projects)
  const fetchProjects = useProjectsStore((s) => s.fetchProjects)

  const [filtroEstado, setFiltroEstado] = useState('abiertos')
  const [toDelete, setToDelete] = useState<NotaAdmin | null>(null)
  const [enviada, setEnviada] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NotaForm>({ defaultValues: emptyForm })

  useEffect(() => {
    fetchNotas(esAdmin)
  }, [fetchNotas, esAdmin])

  useEffect(() => {
    if (!esAdmin) fetchProjects()
  }, [esAdmin, fetchProjects])

  const misProyectos = useMemo(() => {
    if (esAdmin || !user) return []
    return projects
      .filter((p) => !p.deletedAt && isProjectAssignee(p, user.roleName, user.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map((p) => ({ value: String(p.id), label: p.name }))
  }, [projects, esAdmin, user])

  const visibles = useMemo(() => {
    if (filtroEstado === 'todos') return notas
    if (filtroEstado === 'abiertos') return notas.filter((n) => n.estado !== 'Resuelta')
    return notas.filter((n) => n.estado === filtroEstado)
  }, [notas, filtroEstado])

  const pendientes = notas.filter((n) => n.estado === 'Pendiente').length

  const onSubmit = async (data: NotaForm) => {
    const contenido = data.contenido.trim()
    if (!contenido) {
      setError('contenido', { message: 'Escribe el mensaje' })
      return
    }

    const result = await createNota({
      proyectoId: Number(data.proyectoId),
      contenido,
      categoria: data.categoria,
    })

    if (result.success) {
      reset(emptyForm)
      setEnviada(true)
      setTimeout(() => setEnviada(false), 4000)
    } else {
      setError('root', { message: result.error ?? 'Error al enviar el ticket' })
    }
  }

  const handleResponder = async (id: number, texto: string) => {
    await responder(id, texto)
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
            {esAdmin ? 'Mensajes del equipo' : 'Mis tickets'}
          </h1>
          <p className="text-sm text-slate-400">
            {esAdmin
              ? pendientes > 0
                ? `${pendientes} ticket${pendientes > 1 ? 's' : ''} sin abrir`
                : 'Estás al día'
              : 'Abre un ticket sobre un proyecto y sigue la respuesta acá.'}
          </p>
        </div>
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => fetchNotas(esAdmin)}
          loading={loading}
        >
          <IoRefreshOutline size={18} />
          Actualizar
        </Button>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!esAdmin && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 space-y-4 rounded-xl border border-border bg-surface-raised p-4 sm:p-5"
        >
          {errors.root && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errors.root.message}
            </div>
          )}
          {enviada && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              <IoCheckmarkCircleOutline size={18} />
              Ticket enviado. Administración ya fue notificada.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Proyecto"
              placeholder="Elige un proyecto"
              options={misProyectos}
              error={errors.proyectoId?.message}
              {...register('proyectoId', { required: 'Elige el proyecto' })}
            />
            <Select label="Tipo" options={CATEGORIA_OPTIONS} {...register('categoria')} />
          </div>
          <Textarea
            label="Mensaje"
            placeholder="¿Qué necesitas contarle a administración?"
            rows={4}
            maxLength={2000}
            error={errors.contenido?.message}
            {...register('contenido', { required: 'Escribe el mensaje' })}
          />
          <div className="flex justify-end">
            <Button type="submit" className="w-full sm:w-auto" loading={saving || isSubmitting}>
              <IoSendOutline size={16} />
              Abrir ticket
            </Button>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Select
            label="Filtrar"
            options={[
              { value: 'abiertos', label: 'Abiertos' },
              { value: 'todos', label: 'Todos' },
              ...ESTADO_OPTIONS,
            ]}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {loading && notas.length === 0 ? (
          <p className="py-12 text-center text-slate-500">Cargando tickets...</p>
        ) : visibles.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            {esAdmin
              ? 'No hay tickets en este filtro'
              : notas.length === 0
                ? 'Todavía no abriste ningún ticket'
                : 'No hay tickets en este filtro'}
          </p>
        ) : (
          visibles.map((nota) => (
            <TicketCard
              key={nota.id}
              nota={nota}
              esAdmin={esAdmin}
              saving={saving}
              onResponder={handleResponder}
              onCambiarEstado={cambiarEstado}
              onDelete={setToDelete}
            />
          ))
        )}
      </div>

      {!esAdmin && notas.length > 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <IoChatbubbleEllipsesOutline size={14} />
          Administración recibe un aviso por cada ticket y por cada respuesta.
        </p>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar ticket"
        message={
          toDelete
            ? `¿Eliminar el ticket de ${toDelete.autor?.name ?? 'usuario'} sobre "${toDelete.proyecto.name}"? Se borra también su hilo.`
            : ''
        }
        onConfirm={async () => {
          if (toDelete) await deleteNota(toDelete.id)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
