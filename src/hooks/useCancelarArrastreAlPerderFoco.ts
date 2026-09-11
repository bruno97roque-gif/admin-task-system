import { useEffect } from 'react'

/**
 * Cancela cualquier arrastre en curso cuando la ventana pierde el foco.
 *
 * Mientras hay un arrastre activo, dnd-kit (6.3.1) frena todos los clics del
 * documento en la fase de captura, antes de que React los vea, y recién los
 * suelta cuando el arrastre termina o se cancela. Se cancela solo si cambia el
 * tamaño de la ventana, si la pestaña se oculta o con Escape: perder el foco
 * no lo cancela.
 *
 * Entonces, si se estaba arrastrando una tarjeta —o la mano se movió 8 px al
 * hacerle clic— y justo se cambió de ventana (Alt+Tab, el recortador de
 * Windows, una notificación del sistema), el «soltar» nunca llega. Al volver
 * la página se ve normal y el cursor hasta muestra la manito sobre las
 * tarjetas, pero ningún clic funciona hasta recargar.
 *
 * `pointercancel` es el evento que manda el propio navegador cuando interrumpe
 * una interacción con el puntero, y dnd-kit ya lo escucha en el documento:
 * disparándolo, el arrastre se cancela por su camino normal, que es el que
 * saca el freno de clics. También cubre el momento previo a activarse: si se
 * apretó sin llegar a mover los 8 px y se perdió el «soltar», el arrastre se
 * activaría solo más tarde, con el botón ya suelto, al mover el mouse.
 *
 * Sin un arrastre en curso nadie escucha `pointercancel`, así que es inocuo.
 * Se monta una sola vez, en el Layout.
 */
export function useCancelarArrastreAlPerderFoco() {
  useEffect(() => {
    const cancelar = () => {
      document.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }))
    }

    window.addEventListener('blur', cancelar)
    return () => window.removeEventListener('blur', cancelar)
  }, [])
}
