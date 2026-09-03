import descansoGif from '../../assets/descanso.gif'

/** Relleno decorativo para el hueco que queda en la esquina inferior derecha
 * de los tableros canvas (Asignaciones, Diseño) cuando hay pocas tarjetas. */
export function CornerRestGif() {
  return (
    <img
      src={descansoGif}
      alt=""
      draggable={false}
      className="pointer-events-none fixed right-4 bottom-4 z-0 hidden h-52 w-52 rounded-lg object-cover opacity-80 select-none lg:block"
    />
  )
}
