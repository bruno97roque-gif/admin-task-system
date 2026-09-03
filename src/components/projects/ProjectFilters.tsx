import { ESTADO_PROYECTO_OPTIONS } from '../../utils/projectStatus'
import { ORDER_MODE_OPTIONS, type OrderMode } from '../../utils/projectOrder'
import { Select } from '../ui/Select'

export function ProjectFilters({
  estado,
  onEstadoChange,
  orden,
  onOrdenChange,
  estadoOptions = ESTADO_PROYECTO_OPTIONS,
}: {
  estado: string
  onEstadoChange: (value: string) => void
  orden: OrderMode
  onOrdenChange: (value: OrderMode) => void
  estadoOptions?: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-44">
        <Select
          label="Filtrar por estado"
          placeholder="Todos"
          options={estadoOptions}
          value={estado}
          onChange={(e) => onEstadoChange(e.target.value)}
        />
      </div>
      <div className="w-56">
        <Select
          label="Ordenar por"
          options={ORDER_MODE_OPTIONS}
          value={orden}
          onChange={(e) => onOrdenChange(e.target.value as OrderMode)}
        />
      </div>
    </div>
  )
}
