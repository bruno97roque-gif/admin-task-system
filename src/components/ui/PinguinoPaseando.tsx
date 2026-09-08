import caminandoGif from '../../assets/pinguino-caminando.gif'
import quietoGif from '../../assets/pinguino-quieto.gif'

/**
 * Mascota decorativa: el pingüino camina de un lado al otro por el borde
 * inferior de la pantalla, y al pasarle el mouse por encima se detiene y
 * muestra su animación de quieto. Los gifs traen la animación del
 * personaje; el recorrido y el cambio al pasar el mouse los hace CSS
 * (`.pinguino` en index.css), sin JavaScript. Queda por debajo de modales
 * y menú.
 */
export function PinguinoPaseando() {
  return (
    <div className="pinguino fixed bottom-0 z-30 cursor-default select-none" aria-hidden>
      <img src={caminandoGif} alt="" draggable={false} className="pinguino-caminando" />
      <img src={quietoGif} alt="" draggable={false} className="pinguino-quieto" />
    </div>
  )
}
