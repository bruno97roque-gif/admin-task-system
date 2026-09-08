import sonidoNotificacion from '../assets/notificacion.mp3'

/**
 * Sonido y notificación del navegador para las notificaciones internas
 * (cuando llega una nueva).
 */

// Una sola instancia para toda la sesión: si caen varios avisos seguidos, el
// sonido se reinicia en vez de encimarse.
const audio = new Audio(sonidoNotificacion)
audio.volume = 0.6

export function playAlertSound() {
  try {
    audio.currentTime = 0
    // El navegador bloquea el audio hasta que la persona interactúa con la
    // página; ahí la promesa se rechaza y no hay nada que hacer.
    void audio.play().catch(() => {})
  } catch {
    // Audio no disponible
  }
}

export function requestBrowserNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

export function showBrowserNotification(title: string, body: string, tag: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  try {
    new Notification(title, { body, icon: '/favicon.png', tag })
  } catch {
    // Algunos navegadores móviles no permiten `new Notification`
  }
}
