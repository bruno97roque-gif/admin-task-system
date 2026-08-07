import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { IoAddOutline, IoRefreshOutline, IoShieldOutline } from 'react-icons/io5'
import { useRolesStore } from '../stores/rolesStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

interface RoleForm {
  nombre: string
}

const emptyForm: RoleForm = { nombre: '' }

export function RolesPage() {
  const roles = useRolesStore((s) => s.roles)
  const loading = useRolesStore((s) => s.loading)
  const creating = useRolesStore((s) => s.creating)
  const error = useRolesStore((s) => s.error)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)
  const createRole = useRolesStore((s) => s.createRole)

  const [modalOpen, setModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<RoleForm>({ defaultValues: emptyForm })

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const openCreate = () => {
    reset(emptyForm)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    reset(emptyForm)
  }

  const onSubmit = async (data: RoleForm) => {
    const result = await createRole(data.nombre.trim())
    if (result.success) {
      closeModal()
    } else {
      setError('nombre', { message: result.error ?? 'Error al crear el rol' })
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Roles</h1>
          <p className="text-sm text-slate-400">
            Administra los roles del sistema
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => fetchRoles()}
            loading={loading}
          >
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <IoAddOutline size={18} />
            Agregar rol
          </Button>
        </div>
      </header>

      {error && !modalOpen && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && roles.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                  Cargando roles...
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                  No hay roles registrados
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3 text-slate-400">{role.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      <IoShieldOutline className="text-accent" size={16} />
                      {role.name}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="Agregar rol" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej. Administrador"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'El nombre es obligatorio' })}
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
    </div>
  )
}
