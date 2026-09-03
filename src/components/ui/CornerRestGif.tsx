import descansoGif from '../../assets/descanso.gif'

/** Relleno decorativo para el hueco que queda en la esquina inferior derecha
 * de los tableros canvas (Asignaciones, Diseño) cuando hay pocas tarjetas. */
export function CornerRestGif() {
  return (
    <img
      src={descansoGif}
      alt=""
      className="pointer-events-none fixed right-4 bottom-4 z-0 hidden h-40 w-40 rounded-lg object-cover opacity-80 lg:block"
    />
  )
}
