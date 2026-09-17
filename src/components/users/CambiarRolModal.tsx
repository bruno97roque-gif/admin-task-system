import { useState, type FormEvent } from 'react'
import type { AppUser, Role } from '../../types'
import { useUsersStore } from '../../stores/usersStore'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'

/** Qué significa cada rol, para elegir sin dudas. */
const DESCRIPCION_ROL: Record<string, string> = {
  Admin: 'Administración completa. Usa el correo de Google Workspace.',
  Owner: 'Igual que Admin.',
  Supervisor:
    'Hace todo lo que administración y además trabaja como desarrollador: en Developers y Vista Global puede ver solo sus proyectos o los de todos.',
  Programador: 'Ve y trabaja solo sus proyectos de desarrollo.',
  Diseñador: 'Ve y trabaja solo sus proyectos en diseño.',
}

export function CambiarRolModal({
  usuario,
  roles,
  onClose,
}: {
  usuario: AppUser | null
  roles: Role[]
  onClose: () => void
}) {
  if (!usuario) return null
  return <Contenido usuario={usuario} roles={roles} onClose={onClose} />
}

function Contenido({
  usuario,
  roles,
  onClose,
}: {
  usuario: AppUser
  roles: Role[]
  onClose: () => void
}) {
  const updateRol = useUsersStore((s) => s.updateRol)
  const [roleId, setRoleId] = useState(String(usuario.roleId))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const elegido = roles.find((r) => String(r.id) === roleId)

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    if (Number(roleId) === usuario.roleId) {
      onClose()
      return
    }
    setGuardando(true)
    setError(null)
    const result = await updateRol(usuario.id, Number(roleId))
    setGuardando(false)
    if (result.success) onClose()
    else setError(result.error ?? 'No se pudo cambiar el rol')
  }

  return (
    <Modal open onClose={onClose} title={`Rol de ${usuario.name}`} size="sm">
      <form onSubmit={guardar} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <Select
          label="Rol"
          options={roles.map((r) => ({ value: String(r.id), label: r.name }))}
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        />
        {elegido && DESCRIPCION_ROL[elegido.name] && (
          <p className="text-sm text-slate-400">{DESCRIPCION_ROL[elegido.name]}</p>
        )}
        <p className="text-xs text-slate-500">
          El cambio vale desde el próximo pedido que haga la persona; si tiene el sistema abierto,
          que recargue la página.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="w-full sm:w-auto" loading={guardando}>
            Guardar rol
          </Button>
        </div>
      </form>
    </Modal>
  )
}
