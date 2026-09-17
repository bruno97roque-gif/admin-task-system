import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  IoCameraOutline,
  IoCheckmarkCircleOutline,
  IoEyeOffOutline,
  IoEyeOutline,
  IoTrashOutline,
  IoWarningOutline,
} from 'react-icons/io5'
import type { Perfil } from '../types'
import {
  actualizarPerfilRequest,
  borrarFotoRequest,
  cambiarContrasenaRequest,
  getPerfilRequest,
  subirFotoRequest,
} from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useUsersStore } from '../stores/usersStore'
import { prepararFoto } from '../utils/foto'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

type Aviso = { tipo: 'ok' | 'error'; texto: string } | null

function AvisoEnLinea({ aviso }: { aviso: Aviso }) {
  if (!aviso) return null
  const ok = aviso.tipo === 'ok'
  return (
    <p
      role="status"
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
        ok
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          : 'border-red-500/30 bg-red-500/10 text-red-300'
      }`}
    >
      {ok ? (
        <IoCheckmarkCircleOutline size={16} className="mt-0.5 shrink-0" />
      ) : (
        <IoWarningOutline size={16} className="mt-0.5 shrink-0" />
      )}
      {aviso.texto}
    </p>
  )
}

const mensajeDe = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

function Tarjeta({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-surface-raised p-4 sm:p-5">
      <h2 className="text-base font-semibold text-slate-100">{titulo}</h2>
      {descripcion && <p className="mt-0.5 text-sm text-slate-400">{descripcion}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Un dato que la persona ve pero no puede cambiar desde su perfil. */
function DatoFijo({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-300">{etiqueta}</span>
      <span className="break-words rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-slate-400">
        {valor}
      </span>
      {nota && <span className="text-xs text-slate-500">{nota}</span>}
    </div>
  )
}

function CampoContrasena({
  label,
  error,
  autoComplete,
  registro,
}: {
  label: string
  error?: string
  autoComplete: string
  registro: ReturnType<ReturnType<typeof useForm<ContrasenaForm>>['register']>
}) {
  const [visible, setVisible] = useState(false)
  const id = `campo-${registro.name}`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`w-full rounded-lg border border-border bg-surface-raised py-2 pr-10 pl-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:ring-1 focus:ring-accent ${error ? 'border-red-500' : ''}`}
          {...registro}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-200"
        >
          {visible ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface NombreForm {
  name: string
}

interface ContrasenaForm {
  actual: string
  nueva: string
  confirmar: string
}

export function PerfilPage() {
  const usuarioSesion = useAuthStore((s) => s.user)
  const actualizarUsuario = useAuthStore((s) => s.actualizarUsuario)
  const actualizarLocal = useUsersStore((s) => s.actualizarLocal)

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [avisoFoto, setAvisoFoto] = useState<Aviso>(null)
  const [avisoNombre, setAvisoNombre] = useState<Aviso>(null)
  const [avisoContrasena, setAvisoContrasena] = useState<Aviso>(null)

  const [preparando, setPreparando] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [confirmarQuitar, setConfirmarQuitar] = useState(false)
  const [quitando, setQuitando] = useState(false)
  const inputArchivo = useRef<HTMLInputElement>(null)

  const nombreForm = useForm<NombreForm>({ defaultValues: { name: '' } })
  const contrasenaForm = useForm<ContrasenaForm>({
    defaultValues: { actual: '', nueva: '', confirmar: '' },
  })

  /** Lo que devuelve el API se refleja en la sesión y en la lista de usuarios. */
  const aplicar = (nuevo: Perfil) => {
    setPerfil(nuevo)
    actualizarUsuario({ name: nuevo.name, fotoVersion: nuevo.fotoVersion })
    actualizarLocal(nuevo.id, { name: nuevo.name, fotoVersion: nuevo.fotoVersion })
  }

  useEffect(() => {
    let vigente = true
    getPerfilRequest()
      .then((datos) => {
        if (!vigente) return
        setPerfil(datos)
        nombreForm.reset({ name: datos.name })
        actualizarUsuario({ name: datos.name, fotoVersion: datos.fotoVersion })
      })
      .catch((error: unknown) => {
        if (vigente) setErrorCarga(mensajeDe(error, 'No se pudo cargar tu perfil'))
      })
    return () => {
      vigente = false
    }
    // Solo al entrar: el formulario y la sesión se actualizan después a mano.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const elegirArchivo = async (archivo: File | undefined) => {
    if (!archivo) return
    setAvisoFoto(null)
    setPreparando(true)
    try {
      setVistaPrevia(await prepararFoto(archivo))
    } catch (error) {
      setAvisoFoto({ tipo: 'error', texto: mensajeDe(error, 'No se pudo leer la imagen') })
    } finally {
      setPreparando(false)
      // Permite volver a elegir el mismo archivo.
      if (inputArchivo.current) inputArchivo.current.value = ''
    }
  }

  const guardarFoto = async () => {
    if (!vistaPrevia) return
    setSubiendo(true)
    try {
      aplicar(await subirFotoRequest(vistaPrevia))
      setVistaPrevia(null)
      setAvisoFoto({ tipo: 'ok', texto: 'Foto actualizada.' })
    } catch (error) {
      setAvisoFoto({ tipo: 'error', texto: mensajeDe(error, 'No se pudo subir la foto') })
      setVistaPrevia(null)
    } finally {
      setSubiendo(false)
    }
  }

  const quitarFoto = async () => {
    setQuitando(true)
    try {
      aplicar(await borrarFotoRequest())
      setConfirmarQuitar(false)
      setAvisoFoto({ tipo: 'ok', texto: 'Foto quitada.' })
    } catch (error) {
      setAvisoFoto({ tipo: 'error', texto: mensajeDe(error, 'No se pudo quitar la foto') })
      setConfirmarQuitar(false)
    } finally {
      setQuitando(false)
    }
  }

  const guardarNombre = async ({ name }: NombreForm) => {
    setAvisoNombre(null)
    try {
      const nuevo = await actualizarPerfilRequest({ name: name.trim() })
      aplicar(nuevo)
      nombreForm.reset({ name: nuevo.name })
      setAvisoNombre({ tipo: 'ok', texto: 'Nombre actualizado.' })
    } catch (error) {
      setAvisoNombre({ tipo: 'error', texto: mensajeDe(error, 'No se pudo guardar el nombre') })
    }
  }

  const guardarContrasena = async ({ actual, nueva }: ContrasenaForm) => {
    setAvisoContrasena(null)
    try {
      await cambiarContrasenaRequest({ actual, nueva })
      contrasenaForm.reset()
      setAvisoContrasena({
        tipo: 'ok',
        texto: 'Contraseña cambiada. Úsala la próxima vez que inicies sesión.',
      })
    } catch (error) {
      setAvisoContrasena({
        tipo: 'error',
        texto: mensajeDe(error, 'No se pudo cambiar la contraseña'),
      })
    }
  }

  if (errorCarga) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {errorCarga}
      </div>
    )
  }

  if (!perfil || !usuarioSesion) {
    return <p className="py-12 text-center text-slate-500">Cargando tu perfil...</p>
  }

  const tieneFotoSubida = perfil.fotoVersion !== null

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Mi perfil</h1>
        <p className="text-sm text-slate-400">Tu foto, tu nombre y tu contraseña.</p>
      </header>

      <div className="space-y-4">
        <Tarjeta titulo="Foto de perfil" descripcion="Se ve en los tableros, las reuniones y los tickets.">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar userId={perfil.id} name={perfil.name} size={96} className="ring-2 ring-border" />
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <input
                ref={inputArchivo}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void elegirArchivo(e.target.files?.[0])}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  loading={preparando}
                  onClick={() => inputArchivo.current?.click()}
                >
                  <IoCameraOutline size={18} />
                  {tieneFotoSubida ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                {tieneFotoSubida && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => setConfirmarQuitar(true)}
                  >
                    <IoTrashOutline size={18} />
                    Quitar foto
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                JPG, PNG o WebP. Se recorta al centro en forma cuadrada.
              </p>
            </div>
          </div>
          <div className="mt-3">
            <AvisoEnLinea aviso={avisoFoto} />
          </div>
        </Tarjeta>

        <Tarjeta titulo="Tus datos">
          <form onSubmit={nombreForm.handleSubmit(guardarNombre)} className="space-y-4">
            <Input
              label="Nombre"
              autoComplete="name"
              maxLength={100}
              error={nombreForm.formState.errors.name?.message}
              {...nombreForm.register('name', {
                validate: (v) => v.trim().length > 0 || 'El nombre no puede quedar vacío',
              })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <DatoFijo etiqueta="Usuario" valor={perfil.user} />
              <DatoFijo etiqueta="Rol" valor={perfil.roleName} />
            </div>
            <DatoFijo
              etiqueta="Correo corporativo"
              valor={perfil.email ?? 'Sin correo cargado'}
              nota="Si hay que cambiarlo, pídeselo a administración."
            />
            <AvisoEnLinea aviso={avisoNombre} />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={!nombreForm.formState.isDirty}
                loading={nombreForm.formState.isSubmitting}
              >
                Guardar nombre
              </Button>
            </div>
          </form>
        </Tarjeta>

        <Tarjeta titulo="Cambiar contraseña" descripcion="Te pedimos la actual para confirmar que eres tú.">
          <form onSubmit={contrasenaForm.handleSubmit(guardarContrasena)} className="space-y-4">
            {/* Ayuda a los gestores de contraseñas a guardar la nueva con el usuario correcto. */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={perfil.user}
              readOnly
              hidden
            />
            <CampoContrasena
              label="Contraseña actual"
              autoComplete="current-password"
              error={contrasenaForm.formState.errors.actual?.message}
              registro={contrasenaForm.register('actual', {
                required: 'Escribe tu contraseña actual',
              })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoContrasena
                label="Contraseña nueva"
                autoComplete="new-password"
                error={contrasenaForm.formState.errors.nueva?.message}
                registro={contrasenaForm.register('nueva', {
                  required: 'Escribe la contraseña nueva',
                  minLength: { value: 8, message: 'Al menos 8 caracteres' },
                  maxLength: { value: 128, message: 'Como máximo 128 caracteres' },
                  validate: (v, form) =>
                    v !== form.actual || 'Tiene que ser distinta de la actual',
                })}
              />
              <CampoContrasena
                label="Repite la nueva"
                autoComplete="new-password"
                error={contrasenaForm.formState.errors.confirmar?.message}
                registro={contrasenaForm.register('confirmar', {
                  required: 'Repite la contraseña nueva',
                  validate: (v, form) => v === form.nueva || 'No coincide con la nueva',
                })}
              />
            </div>
            <AvisoEnLinea aviso={avisoContrasena} />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full sm:w-auto"
                loading={contrasenaForm.formState.isSubmitting}
              >
                Cambiar contraseña
              </Button>
            </div>
          </form>
        </Tarjeta>
      </div>

      <Modal
        open={vistaPrevia !== null}
        onClose={() => (subiendo ? undefined : setVistaPrevia(null))}
        title="¿Usar esta foto?"
        size="sm"
      >
        {vistaPrevia && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={vistaPrevia}
              alt="Vista previa de tu foto"
              className="h-40 w-40 rounded-full object-cover ring-2 ring-border"
            />
            <p className="text-center text-sm text-slate-400">
              Así se va a ver en el sistema. Si no te convence, elige otra imagen.
            </p>
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={subiendo}
                onClick={() => setVistaPrevia(null)}
              >
                Cancelar
              </Button>
              <Button type="button" className="w-full sm:w-auto" loading={subiendo} onClick={guardarFoto}>
                Guardar foto
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmarQuitar}
        title="Quitar foto"
        message="Vas a volver a la imagen de antes o a tus iniciales."
        confirmLabel="Quitar"
        loading={quitando}
        onConfirm={quitarFoto}
        onCancel={() => setConfirmarQuitar(false)}
      />
    </div>
  )
}
