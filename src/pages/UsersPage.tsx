import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  IoAddOutline,
  IoEyeOffOutline,
  IoEyeOutline,
  IoKeyOutline,
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

interface PasswordForm {
  password: string
}

export function UsersPage() {
  const users = useUsersStore((s) => s.users)
  const loading = useUsersStore((s) => s.loading)
  const creating = useUsersStore((s) => s.creating)
  const saving = useUsersStore((s) => s.saving)
  const error = useUsersStore((s) => s.error)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const createUser = useUsersStore((s) => s.createUser)
  const updatePassword = useUsersStore((s) => s.updatePassword)

  const roles = useRolesStore((s) => s.roles)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)

  const [modalOpen, setModalOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    setError,
  } = useForm<UserForm>({ defaultValues: emptyForm })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    setValue: setValuePassword,
    formState: { errors: passwordErrors },
    setError: setErrorPassword,
  } = useForm<PasswordForm>({ defaultValues: { password: '' } })

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

  const openPasswordModal = (userId: number) => {
    setSelectedUserId(userId)
    resetPassword({ password: '' })
    setShowNewPassword(false)
    setPasswordModalOpen(true)
  }

  const closePasswordModal = () => {
    setPasswordModalOpen(false)
    setSelectedUserId(null)
    resetPassword({ password: '' })
    setShowNewPassword(false)
  }

  const handleGenerateNewPassword = () => {
    setValuePassword('password', generatePassword(), { shouldValidate: true })
    setShowNewPassword(true)
  }

  const onSubmitPassword = async (data: PasswordForm) => {
    if (selectedUserId === null) return
    const result = await updatePassword(selectedUserId, data.password)
    if (result.success) {
      closePasswordModal()
    } else {
      setErrorPassword('root', { message: result.error ?? 'Error al actualizar la contraseña' })
    }
  }

  const handleRefresh = () => {
    fetchUsers()
    fetchRoles()
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Usuarios</h1>
          <p className="text-sm text-slate-400">
            Administra los usuarios del sistema
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleRefresh}
            loading={loading}
          >
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <IoAddOutline size={18} />
            Agregar usuario
          </Button>
        </div>
      </header>

      {error && !modalOpen && !passwordModalOpen && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Cargando usuarios...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => openPasswordModal(user.id)}
                        aria-label="Cambiar contraseña"
                      >
                        <IoKeyOutline size={16} />
                      </Button>
                    </div>
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

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={creating}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={passwordModalOpen}
        onClose={closePasswordModal}
        title="Cambiar contraseña"
        size="sm"
      >
        <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
          {passwordErrors.root && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {passwordErrors.root.message}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-password"
              className="text-sm font-medium text-slate-300"
            >
              Nueva contraseña
            </label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border border-border bg-surface-raised py-2 pr-10 pl-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:ring-1 focus:ring-accent ${passwordErrors.password ? 'border-red-500' : ''}`}
                  {...registerPassword('password', {
                    required: 'La contraseña es obligatoria',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-200"
                  aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showNewPassword ? (
                    <IoEyeOffOutline size={18} />
                  ) : (
                    <IoEyeOutline size={18} />
                  )}
                </button>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerateNewPassword}
                className="shrink-0 px-3"
              >
                <IoShuffleOutline size={16} />
                Generar
              </Button>
            </div>
            {passwordErrors.password && (
              <p className="text-xs text-red-400">{passwordErrors.password.message}</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closePasswordModal}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={saving}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
