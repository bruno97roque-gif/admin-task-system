import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import {
  IoAddOutline,
  IoCreateOutline,
  IoLogInOutline,
  IoRefreshOutline,
  IoStopCircleOutline,
  IoTrashOutline,
  IoTvOutline,
} from 'react-icons/io5'
import type { ComunicadoAdmin, EstadoComunicado, NivelComunicado } from '../types'
import { useComunicadosStore } from '../stores/comunicadosStore'
import { NIVELES } from '../utils/comunicados'
import { formatDateTimeDisplay, toDateTimeInputValue } from '../utils/date'
import { ComunicadoAviso } from '../components/comunicados/ComunicadoAviso'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'

interface ComunicadoForm {
  titulo: string
  mensaje: string
  nivel: NivelComunicado
  enLogin: boolean
  enSistema: boolean
  desde: string
  hasta: string
  notificar: boolean
}

const formVacio = (): ComunicadoForm => ({
  titulo: '',
  mensaje: '',
  nivel: 'Info',
  enLogin: false,
  enSistema: true,
  desde: '',
  hasta: '',
  notificar: false,
})

const ETIQUETA_ESTADO: Record<EstadoComunicado, { texto: string; className: string }> = {
  vigente: { texto: 'Vigente', className: 'bg-emerald-500/15 text-emerald-300' },
  programado: { texto: 'Programado', className: 'bg-sky-500/15 text-sky-300' },
  finalizado: { texto: 'Finalizado', className: 'bg-slate-500/20 text-slate-400' },
}

function Casilla({
  label,
  descripcion,
  registro,
}: {
  label: string
  descripcion: string
  registro: ReturnType<ReturnType<typeof useForm<ComunicadoForm>>['register']>
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-200">
      <input
        type="checkbox"
        className="mt-0.5 rounded border-border bg-surface-raised accent-accent"
        {...registro}
      />
      <span>
        {label}
        <span className="block text-xs text-slate-500">{descripcion}</span>
      </span>
    </label>
  )
}

export function ComunicadosPage() {
  const comunicados = useComunicadosStore((s) => s.todos)
  const cargando = useComunicadosStore((s) => s.cargando)
  const error = useComunicadosStore((s) => s.error)
  const fetchTodos = useComunicadosStore((s) => s.fetchTodos)
  const guardarComunicado = useComunicadosStore((s) => s.guardar)
  const finalizarComunicado = useComunicadosStore((s) => s.finalizar)
  const eliminarComunicado = useComunicadosStore((s) => s.eliminar)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<ComunicadoAdmin | null>(null)
  const [aFinalizar, setAFinalizar] = useState<ComunicadoAdmin | null>(null)
  const [aBorrar, setABorrar] = useState<ComunicadoAdmin | null>(null)
  const [trabajando, setTrabajando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError: setErrorForm,
    formState: { errors, isSubmitting },
  } = useForm<ComunicadoForm>({ defaultValues: formVacio() })

  const vista = useWatch({ control })

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const abrirNuevo = () => {
    setEditando(null)
    reset(formVacio())
    setModalAbierto(true)
  }

  const abrirEdicion = (c: ComunicadoAdmin) => {
    setEditando(c)
    reset({
      titulo: c.titulo,
      mensaje: c.mensaje,
      nivel: c.nivel,
      enLogin: c.enLogin,
      enSistema: c.enSistema,
      desde: toDateTimeInputValue(c.desde),
      hasta: c.hasta ? toDateTimeInputValue(c.hasta) : '',
      notificar: false,
    })
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
  }

  const guardar = async (data: ComunicadoForm) => {
    if (!data.enLogin && !data.enSistema) {
      setErrorForm('root', { message: 'Elige al menos un lugar donde mostrarlo' })
      return
    }
    const desde = data.desde ? new Date(data.desde) : null
    const hasta = data.hasta ? new Date(data.hasta) : null
    if (desde && hasta && hasta <= desde) {
      setErrorForm('hasta', { message: 'Tiene que ser después del inicio' })
      return
    }

    const base = {
      titulo: data.titulo.trim(),
      mensaje: data.mensaje.trim(),
      nivel: data.nivel,
      enLogin: data.enLogin,
      enSistema: data.enSistema,
      ...(desde && { desde: desde.toISOString() }),
      hasta: hasta ? hasta.toISOString() : null,
    }

    const result = await guardarComunicado(editando?.id ?? null, {
      ...base,
      notificar: data.notificar,
    })
    if (result.success) {
      cerrarModal()
    } else {
      setErrorForm('root', { message: result.error })
    }
  }

  const finalizar = async () => {
    if (!aFinalizar) return
    setTrabajando(true)
    setErrorAccion(null)
    const result = await finalizarComunicado(aFinalizar.id)
    setTrabajando(false)
    if (result.success) setAFinalizar(null)
    else setErrorAccion(result.error ?? 'No se pudo finalizar')
  }

  const borrar = async () => {
    if (!aBorrar) return
    setTrabajando(true)
    setErrorAccion(null)
    const result = await eliminarComunicado(aBorrar.id)
    setTrabajando(false)
    if (result.success) setABorrar(null)
    else setErrorAccion(result.error ?? 'No se pudo eliminar')
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Comunicados</h1>
          <p className="text-sm text-slate-400">
            Avisos para todo el equipo: en la página de login, dentro del sistema o en los dos.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => fetchTodos()}
            loading={cargando}
          >
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
          <Button className="w-full sm:w-auto" onClick={abrirNuevo}>
            <IoAddOutline size={18} />
            Nuevo comunicado
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {cargando && comunicados.length === 0 ? (
        <p className="py-12 text-center text-slate-500">Cargando comunicados...</p>
      ) : comunicados.length === 0 ? (
        <p className="py-12 text-center text-slate-500">
          Todavía no hay comunicados. Crea el primero con «Nuevo comunicado».
        </p>
      ) : (
        <div className="space-y-3">
          {comunicados.map((c) => {
            const estado = ETIQUETA_ESTADO[c.estado]
            return (
              <article
                key={c.id}
                className={`rounded-xl border border-border bg-surface-raised p-4 ${
                  c.estado === 'finalizado' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 ${estado.className}`}>
                        {estado.texto}
                      </span>
                      {c.enLogin && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-overlay px-2 py-0.5 text-slate-300">
                          <IoLogInOutline size={12} />
                          Login
                        </span>
                      )}
                      {c.enSistema && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-overlay px-2 py-0.5 text-slate-300">
                          <IoTvOutline size={12} />
                          Sistema
                        </span>
                      )}
                      {c.enSistema && c._count.cierres > 0 && (
                        <span className="text-slate-500">
                          {c._count.cierres === 1
                            ? 'Lo cerró 1 persona'
                            : `Lo cerraron ${c._count.cierres} personas`}
                        </span>
                      )}
                    </div>
                    <ComunicadoAviso comunicado={c} />
                    <p className="text-xs text-slate-500">
                      Desde {formatDateTimeDisplay(c.desde)}
                      {c.hasta ? ` hasta ${formatDateTimeDisplay(c.hasta)}` : ' · sin fecha de fin'}
                      {c.creador && ` · publicado por ${c.creador.name}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {c.estado !== 'finalizado' && (
                      <Button
                        variant="secondary"
                        onClick={() => setAFinalizar(c)}
                        title="Dejar de mostrarlo ya"
                      >
                        <IoStopCircleOutline size={16} />
                        Finalizar
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => abrirEdicion(c)} aria-label="Editar">
                      <IoCreateOutline size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="hover:text-red-400"
                      onClick={() => setABorrar(c)}
                      aria-label="Eliminar"
                    >
                      <IoTrashOutline size={16} />
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={modalAbierto}
        onClose={cerrarModal}
        title={editando ? 'Editar comunicado' : 'Nuevo comunicado'}
        size="lg"
      >
        <form onSubmit={handleSubmit(guardar)} className="space-y-4">
          {errors.root && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errors.root.message}
            </div>
          )}
          <Input
            label="Título"
            maxLength={120}
            placeholder="Actualización del sistema"
            error={errors.titulo?.message}
            {...register('titulo', {
              validate: (v) => v.trim().length > 0 || 'El título es obligatorio',
            })}
          />
          <Textarea
            label="Mensaje"
            rows={4}
            maxLength={2000}
            placeholder="Qué pasa, cuándo y qué tiene que hacer cada uno."
            error={errors.mensaje?.message}
            {...register('mensaje', {
              validate: (v) => v.trim().length > 0 || 'El mensaje es obligatorio',
            })}
          />
          <Select
            label="Nivel"
            options={NIVELES}
            {...register('nivel')}
          />
          <p className="-mt-2 text-xs text-slate-500">
            Los urgentes no se pueden cerrar: se ven hasta que terminan.
          </p>

          <div className="grid gap-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2">
            <Casilla
              label="En la página de login"
              descripcion="Lo ve cualquiera antes de entrar."
              registro={register('enLogin')}
            />
            <Casilla
              label="Dentro del sistema"
              descripcion="Arriba de cada página, para todo el equipo."
              registro={register('enSistema')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Desde (opcional)"
              type="datetime-local"
              {...register('desde')}
            />
            <Input
              label="Hasta (opcional)"
              type="datetime-local"
              error={errors.hasta?.message}
              {...register('hasta')}
            />
          </div>
          <p className="-mt-2 text-xs text-slate-500">
            Sin «desde», se publica ya. Sin «hasta», se muestra hasta que lo finalices.
          </p>

          {!editando && (
            <Casilla
              label="Avisar también con una notificación"
              descripcion="A cada usuario activo le llega a la campanita."
              registro={register('notificar')}
            />
          )}

          {vista.titulo?.trim() && vista.mensaje?.trim() && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-300">Así se va a ver</p>
              <ComunicadoAviso
                comunicado={{
                  id: 0,
                  titulo: vista.titulo,
                  mensaje: vista.mensaje,
                  nivel: vista.nivel ?? 'Info',
                }}
              />
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={isSubmitting}>
              {editando ? 'Guardar cambios' : 'Publicar'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={aFinalizar !== null}
        title="Finalizar comunicado"
        message={aFinalizar ? `«${aFinalizar.titulo}» deja de mostrarse en todos lados.` : ''}
        confirmLabel="Finalizar"
        loading={trabajando}
        error={errorAccion}
        onConfirm={() => void finalizar()}
        onCancel={() => {
          setAFinalizar(null)
          setErrorAccion(null)
        }}
      />

      <ConfirmDialog
        open={aBorrar !== null}
        title="Eliminar comunicado"
        message={aBorrar ? `¿Eliminar «${aBorrar.titulo}»? No se puede deshacer.` : ''}
        loading={trabajando}
        error={errorAccion}
        onConfirm={() => void borrar()}
        onCancel={() => {
          setABorrar(null)
          setErrorAccion(null)
        }}
      />
    </div>
  )
}
