import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useSearchParams } from 'react-router'
import {
  IoAddOutline,
  IoCalendarNumberOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCreateOutline,
  IoInformationCircleOutline,
  IoPeopleOutline,
  IoPersonAddOutline,
  IoRadioButtonOnOutline,
  IoRefreshOutline,
  IoSendOutline,
  IoTrashOutline,
  IoVideocamOutline,
  IoWarningOutline,
} from 'react-icons/io5'
import type {
  Automatico,
  EstadoDeGrabacion,
  Reunion,
  RevisionDeGrabacion,
  SincronizacionGoogle,
} from '../types'
import { useAuthStore } from '../stores/authStore'
import { useReunionesStore } from '../stores/reunionesStore'
import { useProjectsStore } from '../stores/projectsStore'
import { useUsersStore } from '../stores/usersStore'
import { useRolesStore } from '../stores/rolesStore'
import { isRestrictedRole } from '../utils/roleAccess'
import { getUsersByRoleName, toSelectOptions } from '../utils/assignableUsers'
import { formatDateTimeDisplay, toDateTimeInputValue } from '../utils/date'
import {
  componerTitulo,
  enlaceGoogleCalendar,
  esReunionDeEquipo,
  participantesSinCorreo,
  proyectosAgendables,
  TIPOS_REUNION,
  tituloEsLibre,
} from '../utils/reuniones'
import { GoogleCalendarBar } from '../components/reuniones/GoogleCalendarBar'
import { CalendarioReuniones } from '../components/reuniones/CalendarioReuniones'
import { useVistaReuniones } from '../hooks/useVistaReuniones'
import { InvitadosExternosModal } from '../components/reuniones/InvitadosExternosModal'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { MultiSelect } from '../components/ui/MultiSelect'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'

interface ReunionForm {
  tipo: string
  titulo: string
  descripcion: string
  fecha: string
  /** Id del proyecto, o `PROYECTO_WEBSY` para una reunión interna. */
  proyectoId: string
  participantesIds: string[]
  grabarReunion: boolean
  invitadosExternos: string[]
}

/**
 * Opción del selector para las reuniones internas de Websy: van sin proyecto,
 * pero con el tipo de reunión en el título («Websy — Brief»).
 */
const PROYECTO_WEBSY = 'websy'

const emptyForm: ReunionForm = {
  tipo: 'Brief',
  titulo: '',
  descripcion: '',
  fecha: '',
  proyectoId: '',
  participantesIds: [],
  invitadosExternos: [],
  // Encendida por defecto: casi todas las reuniones con clientes se graban.
  grabarReunion: true,
}

type TipoAviso = 'ok' | 'warn' | 'error'

interface Aviso {
  tipo: TipoAviso
  texto: string
}

const ESTILO_AVISO: Record<TipoAviso, string> = {
  ok: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
}

/** Lo que devuelve Google al volver de conectar la cuenta (`?google=`). */
const AVISO_DE_CONEXION: Record<string, Aviso> = {
  conectado: {
    tipo: 'ok',
    texto: 'Google Calendar quedó conectado. Ya puedes enviar las reuniones desde cada tarjeta.',
  },
  cancelado: { tipo: 'warn', texto: 'Se canceló la conexión con Google.' },
  vencido: {
    tipo: 'warn',
    texto: 'El enlace para conectar Google venció. Vuelve a tocar «Conectar Google».',
  },
  error: {
    tipo: 'error',
    texto: 'No se pudo conectar Google. Vuelve a intentarlo en un momento.',
  },
}

const AVISO_DE_GRABACION: Record<EstadoDeGrabacion, Aviso> = {
  activada: {
    tipo: 'ok',
    texto:
      'Enviada a Google Calendar: Google mandó las invitaciones y el Meet va a grabar, transcribir y tomar notas con Gemini.',
  },
  parcial: {
    tipo: 'warn',
    texto:
      'Enviada a Google Calendar, pero Google no aceptó todo: lo que sí aceptó queda activado y lo demás se puede encender dentro del Meet.',
  },
  desactivada: {
    tipo: 'ok',
    texto: 'Enviada a Google Calendar: Google mandó las invitaciones. Esta reunión no se graba.',
  },
  no_disponible: {
    tipo: 'warn',
    texto:
      'Enviada a Google Calendar, pero no se pudo configurar la grabación. Actívala desde el evento: Opciones de videollamada → Registros de la reunión.',
  },
  sin_meet: {
    tipo: 'warn',
    texto:
      'Enviada a Google Calendar, pero Google no generó el Meet. Añádelo desde el evento en Calendar.',
  },
}

const AVISO_DE_EDICION: Partial<Record<SincronizacionGoogle, Aviso>> = {
  actualizada: {
    tipo: 'ok',
    texto: 'Cambios guardados y actualizados en Google Calendar; Google avisó a los invitados.',
  },
  error: {
    tipo: 'warn',
    texto:
      'Los cambios se guardaron acá, pero no se pudo actualizar Google Calendar. Corrige el evento allá.',
  },
}

const COMO_ESTA: Record<Automatico, string> = {
  ON: 'sí',
  OFF: 'no',
  SIN_DEFINIR: 'sin definir (manda la configuración de la organización)',
}

/** Arma el aviso con lo que Google tiene guardado para el Meet. */
function avisoDeRevision(revision: RevisionDeGrabacion, pedida: boolean): Aviso {
  const detalle = revision.detalleGrabacion
    ? ` Detalle: ${revision.detalleGrabacion}`
    : ''

  if (!revision.enGoogle) {
    return {
      tipo: 'error',
      texto: `No se pudo leer la configuración del Meet.${detalle}`,
    }
  }

  const { grabacion, transcripcion, notasDeGemini } = revision.enGoogle
  const esperado = pedida ? 'ON' : 'OFF'
  const todoBien =
    grabacion === esperado && transcripcion === esperado && notasDeGemini === esperado

  return {
    tipo: todoBien ? 'ok' : 'warn',
    texto:
      `Según Google: grabar: ${COMO_ESTA[grabacion]} · transcribir: ${COMO_ESTA[transcripcion]} · notas de Gemini: ${COMO_ESTA[notasDeGemini]}.` +
      (todoBien && pedida
        ? ' Arranca sola cuando entre al Meet alguien de Websy con permiso para grabar.'
        : '') +
      detalle,
  }
}

/** Una reunión sigue siendo «próxima» hasta una hora después de su inicio. */
const MARGEN_EN_CURSO_MS = 60 * 60 * 1000

function ReunionCard({
  reunion,
  pasada,
  puedeEditar,
  puedeEnviar,
  enviando,
  revisando,
  onEdit,
  onDelete,
  onEnviar,
  onRevisar,
}: {
  reunion: Reunion
  pasada: boolean
  /** Administración toca cualquiera; el resto, solo las que agendó. */
  puedeEditar: boolean
  /** Administración con Google conectado. */
  puedeEnviar: boolean
  enviando: boolean
  revisando: boolean
  onEdit: (r: Reunion) => void
  onDelete: (r: Reunion) => void
  onEnviar: (r: Reunion) => void
  onRevisar: (r: Reunion) => void
}) {
  const sinCorreo = participantesSinCorreo(reunion)
  const enGoogle = reunion.googleEventId !== null
  const avisoSinCorreo =
    sinCorreo.length > 0
      ? ` Sin correo cargado: ${sinCorreo.join(', ')}, a esos no les llega la invitación.`
      : ''

  return (
    <article
      className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between ${
        pasada ? 'border-border/50 bg-surface-raised/50 opacity-70' : 'border-border bg-surface-raised'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-100">{reunion.titulo}</h3>
          {reunion.proyecto ? (
            <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-slate-300">
              {reunion.proyecto.name}
            </span>
          ) : (
            <span
              title="Reunión interna, sin proyecto"
              className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent-hover"
            >
              Websy
            </span>
          )}
          {enGoogle && (
            <span
              title={
                reunion.enviadaAt
                  ? `Enviada a Google Calendar el ${formatDateTimeDisplay(reunion.enviadaAt)}`
                  : 'Enviada a Google Calendar'
              }
              className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-300"
            >
              <IoCheckmarkCircleOutline size={13} />
              En Google Calendar
            </span>
          )}
          {reunion.grabarReunion && (
            <span
              title="El Meet arranca grabando y con transcripción"
              className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-300"
            >
              <IoRadioButtonOnOutline size={12} />
              Se graba
            </span>
          )}
        </div>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
          <IoCalendarOutline size={16} className="shrink-0 text-slate-500" />
          {formatDateTimeDisplay(reunion.fecha)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <IoPeopleOutline size={16} className="shrink-0 text-slate-500" />
          {reunion.participantes.length === 0 ? (
            <span>Sin convocados</span>
          ) : (
            reunion.participantes.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1.5 rounded-full bg-surface-overlay/60 py-0.5 pl-0.5 pr-2 text-xs text-slate-200"
              >
                <Avatar userId={p.id} name={p.name} size={20} />
                {p.name}
              </span>
            ))
          )}
        </div>
        {reunion.invitadosExternos.length > 0 && (
          <p className="mt-2 flex items-start gap-2 text-xs text-slate-400">
            <IoPersonAddOutline size={15} className="mt-px shrink-0 text-slate-500" />
            <span className="min-w-0 break-words">
              Clientes: {reunion.invitadosExternos.join(', ')}
            </span>
          </p>
        )}
        {reunion.creador && (
          <p className="mt-2 text-xs text-slate-500">
            Agendada por <span className="text-slate-400">{reunion.creador.name}</span>
          </p>
        )}
        {reunion.descripcion && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-400">
            {reunion.descripcion}
          </p>
        )}
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
        {reunion.linkMeet ? (
          <a
            href={reunion.linkMeet}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 sm:w-auto"
          >
            <IoVideocamOutline size={16} />
            Unirse a Meet
          </a>
        ) : (
          <span
            title="Todavía no está en Google Calendar. Administración la envía desde acá y Google genera el Meet."
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 sm:w-auto"
          >
            <IoWarningOutline size={16} />
            Falta el link
          </span>
        )}
        {enGoogle ? (
          puedeEnviar &&
          !pasada && (
            <Button
              variant="secondary"
              onClick={() => onRevisar(reunion)}
              loading={revisando}
              title="Vuelve a aplicar la grabación en el Meet y muestra lo que Google tiene guardado"
            >
              <IoRadioButtonOnOutline size={16} />
              Revisar grabación
            </Button>
          )
        ) : puedeEnviar && !pasada ? (
          // Con la cuenta conectada, el sistema crea el evento él mismo: con
          // Meet, invitaciones y la grabación configurada.
          <Button
            onClick={() => onEnviar(reunion)}
            loading={enviando}
            title={
              (reunion.linkMeet
                ? 'Ya tiene un link cargado a mano: enviarla crea el evento con un Meet nuevo, que reemplaza al actual.'
                : 'Crea el evento en Google Calendar con Meet y manda las invitaciones.') +
              avisoSinCorreo
            }
          >
            <IoSendOutline size={16} />
            Enviar al Calendar
            {sinCorreo.length > 0 && <span className="text-amber-200">!</span>}
          </Button>
        ) : (
          // Sin conexión, llevarla al Calendar es abrir un link prellenado: lo
          // puede hacer cualquiera que vea la reunión. Esa URL es un
          // «template» y siempre crea un evento NUEVO; el texto lo dice para
          // que nadie duplique sin querer.
          <a
            href={enlaceGoogleCalendar(reunion)}
            target="_blank"
            rel="noreferrer"
            title={
              'Crea un evento NUEVO en Google Calendar con los convocados. Si ya lo creaste antes, edítalo desde Calendar en vez de volver a tocar acá.' +
              avisoSinCorreo
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-overlay px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
          >
            <IoCalendarNumberOutline size={16} />
            Crear en Calendar
            {sinCorreo.length > 0 && <span className="text-amber-400">!</span>}
          </a>
        )}
        {puedeEditar && (
          <>
            <Button variant="secondary" onClick={() => onEdit(reunion)} aria-label="Editar">
              <IoCreateOutline size={16} />
            </Button>
            <Button
              variant="ghost"
              className="hover:text-red-400"
              onClick={() => onDelete(reunion)}
              aria-label="Eliminar"
            >
              <IoTrashOutline size={16} />
            </Button>
          </>
        )}
      </div>
    </article>
  )
}

export function ReunionesPage() {
  const user = useAuthStore((s) => s.user)
  const esAdmin = !isRestrictedRole(user?.roleName)

  const reuniones = useReunionesStore((s) => s.reuniones)
  // «Ahora» fijado en la última carga: separar próximas de pasadas sin Date.now() en el render.
  const ahora = useReunionesStore((s) => s.cargadoEn)
  const loading = useReunionesStore((s) => s.loading)
  const saving = useReunionesStore((s) => s.saving)
  const error = useReunionesStore((s) => s.error)
  const fetchReuniones = useReunionesStore((s) => s.fetchReuniones)
  const createReunion = useReunionesStore((s) => s.createReunion)
  const updateReunion = useReunionesStore((s) => s.updateReunion)
  const deleteReunion = useReunionesStore((s) => s.deleteReunion)
  const google = useReunionesStore((s) => s.google)
  const enviandoId = useReunionesStore((s) => s.enviandoId)
  const fetchEstadoGoogle = useReunionesStore((s) => s.fetchEstadoGoogle)
  const enviarAlCalendar = useReunionesStore((s) => s.enviarAlCalendar)
  const revisandoId = useReunionesStore((s) => s.revisandoId)
  const revisarGrabacion = useReunionesStore((s) => s.revisarGrabacion)
  const googleConectada = esAdmin && google?.conectada === true

  const projects = useProjectsStore((s) => s.projects)
  const fetchProjects = useProjectsStore((s) => s.fetchProjects)
  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const roles = useRolesStore((s) => s.roles)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Reunion | null>(null)
  const [toDelete, setToDelete] = useState<Reunion | null>(null)
  const [showPasadas, setShowPasadas] = useState(false)
  const [vista, setVista] = useVistaReuniones()
  // La reunión a la que saltó el calendario: se resalta un momento en la lista.
  const [resaltada, setResaltada] = useState<number | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorAlEliminar, setErrorAlEliminar] = useState<string | null>(null)
  const [invitandoClientes, setInvitandoClientes] = useState(false)

  // Al volver de conectar Google, el resultado llega en `?google=`. Se lee una
  // vez para el aviso inicial y se limpia de la URL, para que recargar la
  // página no lo repita.
  const [searchParams, setSearchParams] = useSearchParams()
  const [aviso, setAviso] = useState<Aviso | null>(() => {
    const resultado = searchParams.get('google')
    return resultado ? (AVISO_DE_CONEXION[resultado] ?? null) : null
  })

  useEffect(() => {
    if (searchParams.has('google')) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReunionForm>({ defaultValues: emptyForm })

  // El título se arma con el proyecto primero y después el tipo. Con «Otros» y
  // con la reunión de equipo lo escribe quien agenda.
  const tipo = useWatch({ control, name: 'tipo' })
  const proyectoIdForm = useWatch({ control, name: 'proyectoId' })
  const invitadosExternos = useWatch({ control, name: 'invitadosExternos' })
  const esDeEquipo = esReunionDeEquipo(tipo)
  const tituloLibre = tituloEsLibre(tipo)

  // Se recalcula en el onChange y no en un efecto: así el título solo cambia
  // cuando la persona toca el tipo o el proyecto, nunca por detrás.
  const actualizarTitulo = (nuevoTipo: string, nuevoProyectoId: string) => {
    if (nuevoTipo === 'Otros') return
    const nombre =
      nuevoProyectoId === PROYECTO_WEBSY
        ? 'Websy'
        : projects.find((p) => String(p.id) === nuevoProyectoId)?.name
    setValue('titulo', componerTitulo(nuevoTipo, nombre))
  }

  useEffect(() => {
    fetchReuniones(esAdmin)
  }, [fetchReuniones, esAdmin])

  // La conexión con Google es cosa de administración: el resto ni la consulta.
  useEffect(() => {
    if (esAdmin) fetchEstadoGoogle()
  }, [fetchEstadoGoogle, esAdmin])

  useEffect(() => {
    // Todos pueden agendar, así que todos necesitan la lista de convocables
    // y de proyectos para armar el formulario.
    fetchProjects()
    fetchUsers()
    fetchRoles()
  }, [fetchProjects, fetchUsers, fetchRoles])

  const { proximas, pasadas } = useMemo(() => {
    const limite = ahora - MARGEN_EN_CURSO_MS
    const proximas = reuniones
      .filter((r) => new Date(r.fecha).getTime() >= limite)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    const pasadas = reuniones
      .filter((r) => new Date(r.fecha).getTime() < limite)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    return { proximas, pasadas }
  }, [reuniones, ahora])

  // Administración toca cualquier reunión; el resto, solo las que agendó.
  // Es la misma regla que aplica el API, replicada acá para no ofrecer un
  // botón que después va a dar 403.
  const puedeAdministrar = (reunion: Reunion) =>
    esAdmin || (user !== null && reunion.creadorId === user.id)

  // Las próximas que esperan que administración las lleve a Calendar: las que
  // no tienen link ni están en Google. Las que ya tienen un link cargado a
  // mano no cuentan, aunque no las haya creado el sistema.
  const pendientesDeCalendar = useMemo(
    () => proximas.filter((r) => !r.linkMeet && !r.googleEventId).length,
    [proximas],
  )

  const enviar = async (reunion: Reunion) => {
    setAviso(null)
    const result = await enviarAlCalendar(reunion.id)
    if (result.success) {
      const base = result.grabacion ? AVISO_DE_GRABACION[result.grabacion] : null
      setAviso(
        base && result.detalleGrabacion
          ? { ...base, texto: `${base.texto} Detalle: ${result.detalleGrabacion}` }
          : base,
      )
    } else {
      setAviso({ tipo: 'error', texto: result.error ?? 'No se pudo enviar al Calendar' })
      // Si el problema es la conexión (la revocaron, cambió el secreto), la
      // barra de arriba tiene que mostrarlo.
      fetchEstadoGoogle()
    }
  }

  const revisar = async (reunion: Reunion) => {
    setAviso(null)
    const result = await revisarGrabacion(reunion.id)
    if (result.success && result.revision) {
      setAviso(avisoDeRevision(result.revision, reunion.grabarReunion))
    } else {
      setAviso({ tipo: 'error', texto: result.error ?? 'No se pudo revisar la grabación' })
      fetchEstadoGoogle()
    }
  }

  const confirmarEliminar = async () => {
    if (!toDelete) return
    setEliminando(true)
    const result = await deleteReunion(toDelete.id)
    setEliminando(false)
    if (result.success) {
      setToDelete(null)
      setErrorAlEliminar(null)
    } else {
      setErrorAlEliminar(result.error ?? 'Error al eliminar la reunión')
    }
  }

  const cerrarEliminar = () => {
    setToDelete(null)
    setErrorAlEliminar(null)
  }

  const activeUsers = useMemo(() => users.filter((u) => u.active), [users])
  const participantGroups = useMemo(() => {
    const disenadores = getUsersByRoleName(activeUsers, roles, 'Diseñador')
    const programadores = getUsersByRoleName(activeUsers, roles, 'Programador')
    const asignados = new Set([...disenadores, ...programadores].map((u) => u.id))
    const otros = activeUsers.filter((u) => !asignados.has(u.id))
    return [
      { label: 'Diseñadores', options: toSelectOptions(disenadores) },
      { label: 'Programadores', options: toSelectOptions(programadores) },
      { label: 'Otros', options: toSelectOptions(otros) },
    ]
  }, [activeUsers, roles])

  // Solo los proyectos sobre los que esta persona puede convocar: el
  // diseñador los suyos en diseño, el desarrollador los suyos, y
  // administración todos. Arriba de todo, «Websy» para las internas, que
  // cualquiera puede agendar porque no tocan el proyecto de nadie.
  const projectOptions = useMemo(
    () => [
      { value: PROYECTO_WEBSY, label: 'Websy (interna, sin proyecto)' },
      ...proyectosAgendables(projects, user?.roleName, user?.id)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        .map((p) => ({ value: String(p.id), label: p.name })),
    ],
    [projects, user],
  )

  /**
   * El calendario es de consulta: al tocar una reunión se vuelve a la lista,
   * se abre «pasadas» si hace falta y se salta a su tarjeta.
   */
  const irALaLista = (reunion: Reunion) => {
    setVista('lista')
    if (new Date(reunion.fecha).getTime() < ahora) setShowPasadas(true)
    setResaltada(reunion.id)
    // El siguiente pintado ya tiene la lista montada.
    requestAnimationFrame(() => {
      document
        .getElementById(`reunion-${reunion.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    window.setTimeout(() => setResaltada(null), 2500)
  }

  const openCreate = () => {
    setEditing(null)
    reset(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (reunion: Reunion) => {
    setEditing(reunion)
    const esTituloDeEquipo = reunion.titulo === componerTitulo('Equipo', undefined)
    reset({
      // Al editar el título queda libre, para no pisar lo que ya se escribió.
      // Sin proyecto puede ser la «Reunión de equipo» o una interna de Websy;
      // se distinguen por el título fijo de la primera.
      tipo: reunion.proyectoId || !esTituloDeEquipo ? 'Otros' : 'Equipo',
      titulo: reunion.titulo,
      descripcion: reunion.descripcion ?? '',
      fecha: toDateTimeInputValue(reunion.fecha),
      proyectoId: reunion.proyectoId ? String(reunion.proyectoId) : PROYECTO_WEBSY,
      participantesIds: reunion.participantes.map((p) => String(p.id)),
      grabarReunion: reunion.grabarReunion,
      invitadosExternos: reunion.invitadosExternos,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    reset(emptyForm)
  }

  const onSubmit = async (data: ReunionForm) => {
    const fecha = new Date(data.fecha)
    if (Number.isNaN(fecha.getTime())) {
      setError('fecha', { message: 'Fecha y hora inválidas' })
      return
    }

    const payload = {
      titulo: data.titulo.trim(),
      descripcion: data.descripcion.trim() || null,
      fecha: fecha.toISOString(),
      // La reunión de equipo y las internas de Websy no llevan proyecto.
      proyectoId:
        esReunionDeEquipo(data.tipo) || !data.proyectoId || data.proyectoId === PROYECTO_WEBSY
          ? null
          : Number(data.proyectoId),
      participantesIds: data.participantesIds.map(Number),
      grabarReunion: data.grabarReunion,
      invitadosExternos: data.invitadosExternos,
    }

    const result: { success: boolean; error?: string; google?: SincronizacionGoogle } =
      editing ? await updateReunion(editing.id, payload) : await createReunion(payload)

    if (result.success) {
      setAviso(result.google ? (AVISO_DE_EDICION[result.google] ?? null) : null)
      closeModal()
    } else {
      setError('root', { message: result.error ?? 'Error al guardar la reunión' })
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
            {esAdmin ? 'Reuniones' : 'Mis reuniones'}
          </h1>
          <p className="text-sm text-slate-400">
            {esAdmin
              ? 'Toda la agenda del equipo, con quién convocó cada reunión.'
              : 'Las tuyas y las que agendaste. Cada convocado recibe el link de Meet.'}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="flex rounded-lg border border-border bg-surface-raised p-0.5">
            {(['lista', 'mes', 'semana'] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => setVista(opcion)}
                aria-pressed={vista === opcion}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors sm:flex-none ${
                  vista === opcion
                    ? 'bg-accent text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {opcion}
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => fetchReuniones(esAdmin)}
            loading={loading}
          >
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <IoAddOutline size={18} />
            Nueva reunión
          </Button>
        </div>
      </header>

      {error && !modalOpen && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {esAdmin && google && <GoogleCalendarBar google={google} />}

      {aviso && (
        <div
          role="status"
          className={`mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${ESTILO_AVISO[aviso.tipo]}`}
        >
          {aviso.tipo === 'ok' ? (
            <IoCheckmarkCircleOutline size={18} className="mt-0.5 shrink-0" />
          ) : (
            <IoWarningOutline size={18} className="mt-0.5 shrink-0" />
          )}
          <span className="min-w-0 flex-1">{aviso.texto}</span>
          <button
            type="button"
            onClick={() => setAviso(null)}
            aria-label="Cerrar aviso"
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <IoCloseOutline size={18} />
          </button>
        </div>
      )}

      {/* El equipo agenda sin link porque no tiene Workspace; el evento de
          Google lo crea administración. Esto es su cola de pendientes. */}
      {esAdmin && pendientesDeCalendar > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <IoWarningOutline size={18} className="mt-0.5 shrink-0" />
          <span>
            {pendientesDeCalendar === 1
              ? 'Hay 1 reunión próxima que todavía no está en Google Calendar: '
              : `Hay ${pendientesDeCalendar} reuniones próximas que todavía no están en Google Calendar: `}
            {googleConectada ? (
              <>
                toca «Enviar al Calendar» en cada una. Google genera el Meet, manda las
                invitaciones y deja la grabación como indica cada reunión.
              </>
            ) : (
              <>
                conecta Google arriba para enviarlas desde acá con su Meet. Mientras tanto,
                «Crear en Calendar» abre el evento prellenado.
              </>
            )}
          </span>
        </div>
      )}

      {vista !== 'lista' && (
        <CalendarioReuniones
          reuniones={reuniones}
          vista={vista}
          ahora={ahora}
          onSelect={irALaLista}
        />
      )}

      {vista === 'lista' && (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Próximas</h2>
        {loading && reuniones.length === 0 ? (
          <p className="py-12 text-center text-slate-500">Cargando reuniones...</p>
        ) : proximas.length === 0 ? (
          <p className="py-8 text-center text-slate-500">No hay reuniones próximas</p>
        ) : (
          proximas.map((r) => (
            <div
              key={r.id}
              id={`reunion-${r.id}`}
              className={`rounded-xl transition-shadow ${
                resaltada === r.id ? 'ring-2 ring-accent' : ''
              }`}
            >
            <ReunionCard
              reunion={r}
              pasada={false}
              puedeEditar={puedeAdministrar(r)}
              puedeEnviar={googleConectada}
              enviando={enviandoId === r.id}
              revisando={revisandoId === r.id}
              onEdit={openEdit}
              onDelete={setToDelete}
              onEnviar={enviar}
              onRevisar={revisar}
            />
            </div>
          ))
        )}
      </section>
      )}

      {vista === 'lista' && pasadas.length > 0 && (
        <section className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => setShowPasadas((v) => !v)}
            className="text-sm font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-300"
          >
            {showPasadas ? 'Ocultar pasadas' : `Ver pasadas (${pasadas.length})`}
          </button>
          {showPasadas &&
            pasadas.map((r) => (
              <div
                key={r.id}
                id={`reunion-${r.id}`}
                className={`rounded-xl transition-shadow ${
                  resaltada === r.id ? 'ring-2 ring-accent' : ''
                }`}
              >
              <ReunionCard
                reunion={r}
                pasada
                puedeEditar={puedeAdministrar(r)}
                puedeEnviar={googleConectada}
                enviando={enviandoId === r.id}
                revisando={revisandoId === r.id}
                onEdit={openEdit}
                onDelete={setToDelete}
                onEnviar={enviar}
                onRevisar={revisar}
              />
              </div>
            ))}
        </section>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar reunión' : 'Nueva reunión'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errors.root.message}
            </div>
          )}
          {/* Si el sistema creó el evento, la edición se lleva sola a Google.
              Si no, el evento de allá (si existe) hay que corregirlo a mano. */}
          {editing?.googleEventId ? (
            <div className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
              <IoInformationCircleOutline size={16} className="mt-px shrink-0" />
              <span>
                Esta reunión está en Google Calendar. Si cambias el horario, el título, la
                descripción, los convocados o los clientes, el evento se actualiza allá y Google
                avisa a los invitados.
              </span>
            </div>
          ) : editing && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <IoWarningOutline size={16} className="mt-px shrink-0" />
              <span>
                Los convocados reciben el cambio acá mismo. Si además ya habías creado el
                evento en Google Calendar, ese hay que editarlo allá: volver a tocar «Crear
                en Calendar» agrega un evento nuevo en vez de corregir el que existe.
              </span>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Tipo de reunión"
              options={TIPOS_REUNION.map((t) => ({ value: t.value, label: t.label }))}
              {...register('tipo', {
                onChange: (e: { target: { value: string } }) =>
                  actualizarTitulo(e.target.value, proyectoIdForm),
              })}
            />
            {!esDeEquipo && (
              <Select
                label="Proyecto"
                placeholder="Elige un proyecto"
                options={projectOptions}
                error={errors.proyectoId?.message}
                {...register('proyectoId', {
                  required: 'Elige el proyecto',
                  onChange: (e: { target: { value: string } }) =>
                    actualizarTitulo(tipo, e.target.value),
                })}
              />
            )}
          </div>

          <Input
            label="Título"
            placeholder="Presentación de avance de diseño"
            readOnly={!tituloLibre}
            className={tituloLibre ? '' : 'cursor-default text-slate-400'}
            error={errors.titulo?.message}
            {...register('titulo', { required: 'El título es obligatorio' })}
          />
          {!tituloLibre && (
            <p className="-mt-2 text-xs text-slate-500">
              Se arma solo con el proyecto y el tipo. Elige «Otros» para escribirlo.
            </p>
          )}

          <Input
            label="Fecha y hora"
            type="datetime-local"
            error={errors.fecha?.message}
            {...register('fecha', { required: 'La fecha es obligatoria' })}
          />
          {/* El link de Meet ya no se pide: lo genera Google cuando
              administración envía la reunión al Calendar. */}
          <Controller
            control={control}
            name="participantesIds"
            rules={{ validate: (value) => value.length > 0 || 'Elige al menos un participante' }}
            render={({ field }) => (
              <MultiSelect
                label="Participantes"
                groups={participantGroups}
                value={field.value}
                onChange={field.onChange}
                error={errors.participantesIds?.message}
                emptyMessage="No hay usuarios activos"
              />
            )}
          />
          <Textarea
            label="Descripción (opcional)"
            placeholder="Temario, qué hay que preparar..."
            rows={3}
            {...register('descripcion')}
          />
          <div className="rounded-lg border border-border bg-surface px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-300">Clientes invitados (opcional)</p>
                <p className="text-xs text-slate-500">
                  {invitadosExternos.length === 0
                    ? 'Reciben la invitación de Google Calendar con el link de Meet.'
                    : invitadosExternos.length === 1
                      ? '1 correo'
                      : `${invitadosExternos.length} correos`}
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setInvitandoClientes(true)}>
                <IoPersonAddOutline size={16} />
                {invitadosExternos.length === 0 ? 'Invitar clientes' : 'Editar'}
              </Button>
            </div>
            {invitadosExternos.length > 0 && (
              <p className="mt-2 break-words text-xs text-slate-400">
                {invitadosExternos.join(', ')}
              </p>
            )}
          </div>
          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                className="rounded border-border bg-surface-raised accent-accent"
                {...register('grabarReunion')}
              />
              Grabar, transcribir y tomar notas
            </label>
            <p className="mt-1 pl-6 text-xs text-slate-500">
              El Meet arranca grabando, con transcripción y notas de Gemini; los archivos quedan
              en el Drive de la cuenta de Websy.{' '}
              {editing?.googleEventId
                ? 'Si la cambias, se actualiza en el Meet al guardar.'
                : 'Se aplica cuando la reunión se envía a Google Calendar.'}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={saving || isSubmitting}>
              {editing ? 'Guardar cambios' : 'Agendar reunión'}
            </Button>
          </div>
        </form>
      </Modal>

      <InvitadosExternosModal
        open={invitandoClientes}
        correos={invitadosExternos}
        onClose={() => setInvitandoClientes(false)}
        onGuardar={(correos) => setValue('invitadosExternos', correos, { shouldDirty: true })}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar reunión"
        message={
          toDelete
            ? toDelete.googleEventId
              ? `¿Eliminar "${toDelete.titulo}"? También se cancela el evento en Google Calendar y Google avisa a los invitados.`
              : `¿Eliminar "${toDelete.titulo}"?`
            : ''
        }
        loading={eliminando}
        error={errorAlEliminar}
        onConfirm={confirmarEliminar}
        onCancel={cerrarEliminar}
      />
    </div>
  )
}
