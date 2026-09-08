import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import {
  IoAddOutline,
  IoEyeOffOutline,
  IoEyeOutline,
  IoKeyOutline,
  IoMailOutline,
  IoOpenOutline,
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
import { ejemploDeCorreo } from '../utils/correo'
import { esAdministracion } from '../utils/roleAccess'
import { enlaceWebmail } from '../utils/webmail'

interface UserForm {
  name: string
  user: string
  password: string
  roleId: string
  email: string
}

const emptyForm: UserForm = {
  name: '',
  user: '',
  password: '',
  roleId: '',
  email: '',
}

interface PasswordForm {
  password: string
}

interface EmailForm {
  email: string
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
  const updateEmail = useUsersStore((s) => s.updateEmail)

  const roles = useRolesStore((s) => s.roles)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)

  const [modalOpen, setModalOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  // Rol de la persona cuyo correo se está editando: define qué dominio
  // sugerir en el placeholder.
  const [rolDelCorreo, setRolDelCorreo] = useState<string | undefined>(undefined)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
    setError,
  } = useForm<UserForm>({ defaultValues: emptyForm })

  // El dominio del correo depende del rol elegido, así que el placeholder
  // sigue al selector mientras se carga el alta.
  const roleIdElegido = useWatch({ control, name: 'roleId' })

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    reset: resetEmail,
    formState: { errors: emailErrors },
    setError: setErrorEmail,
  } = useForm<EmailForm>({ defaultValues: { email: '' } })

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
      email: data.email.trim() || null,
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

  const openEmailModal = (userId: number, email: string, roleName?: string) => {
    setSelectedUserId(userId)
    setRolDelCorreo(roleName)
    resetEmail({ email })
    setEmailModalOpen(true)
  }

  const closeEmailModal = () => {
    setEmailModalOpen(false)
    setSelectedUserId(null)
    setRolDelCorreo(undefined)
    resetEmail({ email: '' })
  }

  const onSubmitEmail = async (data: EmailForm) => {
    if (selectedUserId === null) return
    const result = await updateEmail(selectedUserId, data.email.trim() || null)
    if (result.success) {
      closeEmailModal()
    } else {
      setErrorEmail('root', { message: result.error ?? 'Error al guardar el correo' })
    }
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
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Cargando usuarios...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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
                  <td className="px-4 py-3">
                    {!user.email ? (
                      <span className="text-xs text-slate-600">Sin correo</span>
                    ) : esAdministracion(roleMap.get(user.roleId)) ? (
                      // Administración usa Workspace: el webmail del hosting
                      // no le sirve, así que el correo va como texto.
                      <span className="text-slate-400">{user.email}</span>
                    ) : (
                      <a
                        href={enlaceWebmail(user.email) ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir su webmail"
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-accent-hover hover:underline"
                      >
                        <IoOpenOutline size={13} className="shrink-0" />
                        {user.email}
                      </a>
                    )}
                  </td>
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
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          openEmailModal(user.id, user.email ?? '', roleMap.get(user.roleId))
                        }
                        aria-label="Editar correo"
                        title="Editar correo"
                      >
                        <IoMailOutline size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => openPasswordModal(user.id)}
                        aria-label="Cambiar contraseña"
                        title="Cambiar contraseña"
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

      <Modal
        open={emailModalOpen}
        onClose={closeEmailModal}
        title="Correo del usuario"
        size="sm"
      >
        <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4">
          {emailErrors.root && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {emailErrors.root.message}
            </div>
          )}
          <p className="text-sm text-slate-400">
            Se usa para invitar a la persona al evento de Google Calendar cuando se
            agenda una reunión. Déjalo vacío para quitarlo.
          </p>
          <Input
            label="Correo"
            type="email"
            placeholder={ejemploDeCorreo(rolDelCorreo)}
            error={emailErrors.email?.message}
            {...registerEmail('email')}
          />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={closeEmailModal}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={saving}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

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

          <Input
            label="Correo (opcional)"
            type="email"
            placeholder={ejemploDeCorreo(roleMap.get(Number(roleIdElegido)))}
            error={errors.email?.message}
            {...register('email')}
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
