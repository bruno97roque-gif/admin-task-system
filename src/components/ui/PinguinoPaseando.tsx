import pinguinoGif from '../../assets/pinguino.gif'

/**
 * Mascota decorativa: el pingüino camina de un lado al otro por el borde
 * inferior de la pantalla. El gif trae la animación del personaje; el
 * recorrido lo hace CSS (`.pinguino` en index.css), sin JavaScript. No
 * captura clics ni tapa nada: queda por debajo de modales y menú.
 */
export function PinguinoPaseando() {
  return (
    <img
      src={pinguinoGif}
      alt=""
      aria-hidden
      draggable={false}
      className="pinguino pointer-events-none fixed bottom-0 z-30 select-none"
    />
  )
}
