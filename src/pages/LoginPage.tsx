import { useForm } from 'react-hook-form'
import { IoLockClosedOutline, IoPersonOutline } from 'react-icons/io5'
import { Navigate, useNavigate } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import { getHomePathForRole } from '../utils/roleAccess'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Logo } from '../components/ui/Logo'

interface LoginForm {
  user: string
  password: string
}

export function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    defaultValues: {
      user: '',
      password: '',
    },
  })

  if (isAuthenticated) {
    return <Navigate to={getHomePathForRole(user?.roleName)} replace />
  }

  const onSubmit = async (data: LoginForm) => {
    const result = await login(data.user, data.password)
    if (result.success) {
      const roleName = useAuthStore.getState().user?.roleName
      navigate(getHomePathForRole(roleName))
    } else {
      setError('root', { message: result.error ?? 'Error al iniciar sesión' })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-lg shadow-orange-500/30">
            <Logo size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Websy Admin</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sistema de gestión de proyectos
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-border bg-surface-raised p-6 shadow-xl"
        >
          <h2 className="mb-5 text-lg font-semibold text-slate-100">
            Iniciar sesión
          </h2>

          {errors.root && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errors.root.message}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <IoPersonOutline
                className="pointer-events-none absolute left-3 top-[38px] text-slate-500"
                size={16}
              />
              <Input
                label="Usuario"
                type="text"
                placeholder="Ing Jauregui"
                className="pl-9"
                error={errors.user?.message}
                {...register('user', { required: 'El usuario es obligatorio' })}
              />
            </div>

            <div className="relative">
              <IoLockClosedOutline
                className="pointer-events-none absolute left-3 top-[38px] text-slate-500"
                size={16}
              />
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                className="pl-9"
                error={errors.password?.message}
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                })}
              />
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" loading={isSubmitting}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
