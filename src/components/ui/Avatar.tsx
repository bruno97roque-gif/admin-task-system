import { getAvatarUrl } from '../../utils/avatars'
import { getInitials } from '../../utils/user'

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
  const photo = getAvatarUrl(userId)

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        draggable={false}
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
