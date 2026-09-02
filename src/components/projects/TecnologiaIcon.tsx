import { SiLinux, SiShopify, SiWordpress } from 'react-icons/si'
import { IoCodeSlashOutline } from 'react-icons/io5'

const TECNOLOGIA_CONFIG: Record<string, { Icon: typeof SiWordpress; color: string }> = {
  WordPress: { Icon: SiWordpress, color: '#7DD3FC' },
  Shopify: { Icon: SiShopify, color: '#95BF47' },
  Personalizado: { Icon: SiLinux, color: '#FCC624' },
}

export function TecnologiaIcon({ tecnologia, size = 13 }: { tecnologia: string; size?: number }) {
  const config = TECNOLOGIA_CONFIG[tecnologia]
  if (!config) return <IoCodeSlashOutline size={size} />
  const { Icon, color } = config
  return <Icon size={size} color={color} />
}
