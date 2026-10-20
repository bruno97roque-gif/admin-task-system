import { useState } from 'react'
import { IoArrowForwardOutline, IoWarningOutline } from 'react-icons/io5'
import type { AppUser, Project, Puesto, ResumenTraspaso, Role } from '../../types'
import { getUsersByRoleName } from '../../utils/assignableUsers'
import { traspasarProyectosRequest } from '../../services/api'
import { proyectosACargo } from '../../utils/proyectosACargo'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'

/**
 * Le pasa a otra persona los proyectos **activos** de alguien: lo que tenía
 * como diseñador y lo que tenía como desarrollador se eligen por separado,
 * porque no siempre los hereda la misma persona. Lo entregado y lo archivado
 * se queda a nombre de quien lo hizo.
 */
export function TraspasarProyectosModal({
  usuario,
  projects,
  users,
  roles,
  onListo,
  onClose,
}: {
  usuario: AppUser
  projects: Project[]
  users: AppUser[]
  roles: Role[]
  /** Se llama al terminar, para recargar lo que haga falta. */
  onListo: (resumen: ResumenTraspaso) => void
  onClose: () => void
}) {
  const aCargo = proyectosACargo(projects, usuario.id)
  const [disenadorDestinoId, setDisenadorDestinoId] = useState('')
  const [desarrolladorDestinoId, setDesarrolladorDestinoId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const candidatos = (puesto: Puesto) =>
    getUsersByRoleName(users, roles, puesto === 'Diseno' ? 'Diseñador' : 'Programador')
      .filter((u) => u.id !== usuario.id && u.active)
      .map((u) => ({ value: String(u.id), label: u.name }))

  const traspasar = async () => {
    if (!disenadorDestinoId && !desarrolladorDestinoId) {
      setError('Elige a quién le pasas los proyectos')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const resumen = await traspasarProyectosRequest({
        deUsuarioId: usuario.id,
        ...(disenadorDestinoId && { disenadorDestinoId: Number(disenadorDestinoId) }),
        ...(desarrolladorDestinoId && {
          desarrolladorDestinoId: Number(desarrolladorDestinoId),
        }),
        ...(motivo.trim() && { motivo: motivo.trim() }),
      })
      onListo(resumen)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron traspasar los proyectos')
    } finally {
      setEnviando(false)
    }
  }

  const sinNada = aCargo.diseno.length === 0 && aCargo.desarrollo.length === 0

  return (
    <Modal open onClose={onClose} title={`Traspasar los proyectos de ${usuario.name}`}>
      <div className="space-y-4">
        {sinNada ? (
          <p className="py-4 text-center text-sm text-slate-400">
            No tiene proyectos activos a su cargo: no hay nada que traspasar.
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-400">
              Se mueven solo los proyectos activos. Los entregados y los archivados
              quedan a su nombre, para no cambiar el historial ni la analítica.
            </p>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            {aCargo.diseno.length > 0 && (
              <section className="rounded-xl border border-border bg-surface p-3">
                <p className="mb-2 text-sm text-slate-300">
                  Como diseñador:{' '}
                  <span className="font-semibold text-slate-100">
                    {aCargo.diseno.length}
                  </span>{' '}
                  {aCargo.diseno.length === 1 ? 'proyecto' : 'proyectos'}
                </p>
                <Select
                  label="Pasárselos a"
                  value={disenadorDestinoId}
                  onChange={(e) => setDisenadorDestinoId(e.target.value)}
                  options={[{ value: '', label: 'No traspasar' }, ...candidatos('Diseno')]}
                />
                <ul className="mt-2 max-h-24 space-y-0.5 overflow-y-auto text-xs text-slate-500">
                  {aCargo.diseno.map((p) => (
                    <li key={p.id} className="truncate">
                      {p.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {aCargo.desarrollo.length > 0 && (
              <section className="rounded-xl border border-border bg-surface p-3">
                <p className="mb-2 text-sm text-slate-300">
                  Como desarrollador:{' '}
                  <span className="font-semibold text-slate-100">
                    {aCargo.desarrollo.length}
                  </span>{' '}
                  {aCargo.desarrollo.length === 1 ? 'proyecto' : 'proyectos'}
                </p>
                <Select
                  label="Pasárselos a"
                  value={desarrolladorDestinoId}
                  onChange={(e) => setDesarrolladorDestinoId(e.target.value)}
                  options={[
                    { value: '', label: 'No traspasar' },
                    ...candidatos('Desarrollo'),
                  ]}
                />
                <ul className="mt-2 max-h-24 space-y-0.5 overflow-y-auto text-xs text-slate-500">
                  {aCargo.desarrollo.map((p) => (
                    <li key={p.id} className="truncate">
                      {p.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Input
              label="Motivo (opcional)"
              placeholder="Aaron deja el equipo"
              value={motivo}
              maxLength={200}
              onChange={(e) => setMotivo(e.target.value)}
            />

            <p className="flex items-start gap-2 text-xs text-slate-500">
              <IoWarningOutline size={15} className="mt-0.5 shrink-0 text-amber-300" />
              Queda registrado en el historial de cada proyecto y quien recibe se entera
              por una notificación.
            </p>
          </>
        )}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
            {sinNada ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!sinNada && (
            <Button className="w-full sm:w-auto" loading={enviando} onClick={() => void traspasar()}>
              <IoArrowForwardOutline size={18} />
              Traspasar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
