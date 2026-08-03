import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  IoAddOutline,
  IoEyeOffOutline,
  IoEyeOutline,
  IoPeopleOutline,
  IoRefreshOutline,
  IoShuffleOutline,
} from 'react-icons/io5'
import { useRolesStore } from '../stores/rolesStore'
import { useUsersStore } from '../stores/usersStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { generatePassword } from '../utils/password'

interface UserForm {
  name: string
  user: string
  password: string
  roleId: string
}

const emptyForm: UserForm = {
  name: '',
  user: '',
  password: '',
  roleId: '',
}

export function UsersPage() {
  const users = useUsersStore((s) => s.users)
  const loading = useUsersStore((s) => s.loading)
  const creating = useUsersStore((s) => s.creating)
  const error = useUsersStore((s) => s.error)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const createUser = useUsersStore((s) => s.createUser)

  const roles = useRolesStore((s) => s.roles)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)

  const [modalOpen, setModalOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    setError,
  } = useForm<UserForm>({ defaultValues: emptyForm })

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [fetchUsers, fetchRoles])

  const roleMap = useMemo(
    () => new Map(roles.map((role) => [role.id, role.name])),
    [roles],
  )

  const roleOptions = roles.map((role) => ({
    value: String(role.id),
    label: role.name,
  }))

  const openCreate = () => {
    reset(emptyForm)
    setShowPassword(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    reset(emptyForm)
    setShowPassword(false)
  }

  const handleGeneratePassword = () => {
    setValue('password', generatePassword(), { shouldValidate: true })
    setShowPassword(true)
  }

  const onSubmit = async (data: UserForm) => {
    const result = await createUser({
      name: data.name.trim(),
      user: data.user.trim(),
      password: data.password,
      roleId: Number(data.roleId),
    })

    if (result.success) {
      closeModal()
    } else {
      setError('root', { message: result.error ?? 'Error al crear el usuario' })
    }
  }

  const handleRefresh = () => {
    fetchUsers()
    fetchRoles()
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Usuarios</h1>
          <p className="text-sm text-slate-400">
            Administra los usuarios del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleRefresh} loading={loading}>
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
          <Button onClick={openCreate}>
            <IoAddOutline size={18} />
            Agregar usuario
          </Button>
        </div>
      </header>

      {error && !modalOpen && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Cargando usuarios...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3 text-slate-400">{user.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      <IoPeopleOutline className="text-accent" size={16} />
                      {user.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{user.user}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {roleMap.get(user.roleId) ?? `Rol #${user.roleId}`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.active
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="Agregar usuario" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errors.root.message}
            </div>
          )}

          <Input
            label="Nombre"
            placeholder="Ej. Aaron"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es obligatorio' })}
          />

          <Input
            label="Usuario"
            placeholder="Ej. Ing Jauregui"
            error={errors.user?.message}
            {...register('user', { required: 'El usuario es obligatorio' })}
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-300"
            >
              Contraseña
            </label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border border-border bg-surface-raised py-2 pr-10 pl-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:ring-1 focus:ring-accent ${errors.password ? 'border-red-500' : ''}`}
                  {...register('password', {
                    required: 'La contraseña es obligatoria',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <IoEyeOffOutline size={18} />
                  ) : (
                    <IoEyeOutline size={18} />
                  )}
                </button>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleGeneratePassword}
                className="shrink-0 px-3"
              >
                <IoShuffleOutline size={16} />
                Generar
              </Button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <Select
            label="Rol"
            options={roleOptions}
            placeholder="Selecciona un rol"
            error={errors.roleId?.message}
            {...register('roleId', { required: 'Selecciona un rol' })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={creating}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
