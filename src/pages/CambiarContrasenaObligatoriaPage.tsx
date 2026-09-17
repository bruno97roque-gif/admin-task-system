import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { IoKeyOutline, IoLogOutOutline } from 'react-icons/io5'
import { cambiarContrasenaRequest } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Logo } from '../components/ui/Logo'

interface Formulario {
  actual: string
  nueva: string
  confirmar: string
}

/**
 * Pantalla que aparece cuando la contraseña la puso administración (alta o
 * reseteo). Hasta cambiarla no se puede usar el resto del sistema: el API
 * también lo bloquea.
 */
export function CambiarContrasenaObligatoriaPage() {
  const user = useAuthStore((s) => s.user)
  const actualizarUsuario = useAuthStore((s) => s.actualizarUsuario)
  const logout = useAuthStore((s) => s.logout)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({ defaultValues: { actual: '', nueva: '', confirmar: '' } })

  const guardar = async ({ actual, nueva }: Formulario) => {
    setError(null)
    try {
      await cambiarContrasenaRequest({ actual, nueva })
      actualizarUsuario({ debeCambiarContrasena: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-lg shadow-orange-500/30">
            <Logo size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Elige tu contraseña</h1>
          <p className="mt-1 text-sm text-slate-400">
            {user?.name ? `Hola, ${user.name}. ` : ''}Entraste con una contraseña temporal: cámbiala
            para seguir.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(guardar)}
          className="space-y-4 rounded-2xl border border-border bg-surface-raised p-6 shadow-xl"
        >
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={user?.user ?? ''}
            readOnly
            hidden
          />
          <Input
            label="Contraseña temporal"
            type="password"
            autoComplete="current-password"
            error={errors.actual?.message}
            {...register('actual', { required: 'Escribe la contraseña con la que entraste' })}
          />
          <Input
            label="Contraseña nueva"
            type="password"
            autoComplete="new-password"
            error={errors.nueva?.message}
            {...register('nueva', {
              required: 'Escribe la contraseña nueva',
              minLength: { value: 8, message: 'Al menos 8 caracteres' },
              maxLength: { value: 128, message: 'Como máximo 128 caracteres' },
              validate: (v, form) => v !== form.actual || 'Tiene que ser distinta de la temporal',
            })}
          />
          <Input
            label="Repite la nueva"
            type="password"
            autoComplete="new-password"
            error={errors.confirmar?.message}
            {...register('confirmar', {
              required: 'Repite la contraseña nueva',
              validate: (v, form) => v === form.nueva || 'No coincide con la nueva',
            })}
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            <IoKeyOutline size={18} />
            Guardar y entrar
          </Button>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-surface-overlay hover:text-slate-200"
          >
            <IoLogOutOutline size={16} />
            Salir
          </button>
        </form>
      </div>
    </div>
  )
}
