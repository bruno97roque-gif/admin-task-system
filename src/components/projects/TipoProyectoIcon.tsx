import { IoCartOutline, IoCodeSlashOutline, IoInformationCircleOutline } from 'react-icons/io5'

const TIPO_PROYECTO_ICONS: Record<string, typeof IoCartOutline> = {
  Ecommerce: IoCartOutline,
  Informativa: IoInformationCircleOutline,
  Sistema: IoCodeSlashOutline,
}

export function TipoProyectoIcon({ tipoProyecto, size = 13 }: { tipoProyecto: string; size?: number }) {
  const Icon = TIPO_PROYECTO_ICONS[tipoProyecto] ?? IoInformationCircleOutline
  return <Icon size={size} color="#ffffff" />
}
