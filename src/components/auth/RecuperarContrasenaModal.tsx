import { useState, type FormEvent } from 'react'
import { IoCheckmarkCircleOutline } from 'react-icons/io5'
import { recuperarContrasenaRequest } from '../../services/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'

/**
 * «Olvidé mi contraseña». No manda correos: avisa a administración, que le
 * pone una contraseña temporal. La respuesta es la misma exista o no el
 * usuario.
 */
export function RecuperarContrasenaModal({
  open,
  usuarioInicial,
  onClose,
}: {
  open: boolean
  usuarioInicial: string
  onClose: () => void
}) {
  if (!open) return null
  return <Contenido usuarioInicial={usuarioInicial} onClose={onClose} />
}

function Contenido({ usuarioInicial, onClose }: { usuarioInicial: string; onClose: () => void }) {
  const [usuario, setUsuario] = useState(usuarioInicial)
  const [enviando, setEnviando] = useState(false)
  const [respuesta, setRespuesta] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!usuario.trim()) {
      setError('Escribe tu usuario')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const { message } = await recuperarContrasenaRequest(usuario.trim())
      setRespuesta(message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el pedido')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="¿Olvidaste tu contraseña?" size="sm">
      {respuesta ? (
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            <IoCheckmarkCircleOutline size={18} className="mt-0.5 shrink-0" />
            {respuesta}
          </p>
          <p className="text-sm text-slate-400">
            Cuando te la pasen, entra con ella: el sistema te va a pedir que elijas una nueva.
          </p>
          <div className="flex justify-end">
            <Button type="button" className="w-full sm:w-auto" onClick={onClose}>
              Entendido
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <p className="text-sm text-slate-400">
            Escribe tu usuario y avisamos a administración para que te dé una contraseña temporal.
          </p>
          <Input
            label="Usuario"
            id="usuario-recuperar"
            autoComplete="username"
            value={usuario}
            error={error ?? undefined}
            onChange={(e) => setUsuario(e.target.value)}
            autoFocus
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={enviando}>
              Pedir ayuda
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
