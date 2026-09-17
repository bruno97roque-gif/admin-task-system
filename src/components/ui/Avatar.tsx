import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useUsersStore } from '../../stores/usersStore'
import { getAvatarUrl, urlDeFotoSubida } from '../../utils/avatars'
import { getInitials } from '../../utils/user'

/**
 * La versión de la foto subida de un usuario. La propia sale de la sesión
 * (cambia al instante al editar el perfil); la de los demás, de la lista de
 * usuarios que carga el layout.
 */
function useFotoVersion(userId: number): number | null | undefined {
  const propia = useAuthStore((s) => (s.user?.id === userId ? s.user.fotoVersion : undefined))
  const deLaLista = useUsersStore((s) => s.users.find((u) => u.id === userId)?.fotoVersion)
  return propia !== undefined ? propia : deLaLista
}

export function Avatar({
  userId,
  name,
  size = 40,
  className = '',
  fallbackClassName = 'bg-accent/20 text-accent-hover',
}: {
  userId: number
  name: string
  size?: number
  className?: string
  fallbackClassName?: string
}) {
  const version = useFotoVersion(userId)
  // Prioridad: la foto que subió la persona, después las fotos fijas de
  // antes, y si no hay ninguna, las iniciales.
  const photo = version != null ? urlDeFotoSubida(userId, version) : getAvatarUrl(userId)
  // Si la imagen no carga (se borró en otra pestaña, sin red), iniciales.
  const [fallida, setFallida] = useState<string | null>(null)

  if (photo && fallida !== photo) {
    return (
      <img
        src={photo}
        alt={name}
        draggable={false}
        onError={() => setFallida(photo)}
        style={{ height: size, width: size }}
        className={`shrink-0 rounded-full object-cover select-none ${className}`}
      />
    )
  }

  return (
    <div
      style={{ height: size, width: size }}
      className={`flex shrink-0 items-center justify-center rounded-full text-sm font-bold ${fallbackClassName} ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}
