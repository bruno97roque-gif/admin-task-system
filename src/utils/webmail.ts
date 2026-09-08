import { WEBMAIL_BASE, WEBMAIL_CUENTA_ID } from '../config/app'

/**
 * Acceso directo al webmail de DonWeb. Los enlaces del panel tienen esta
 * forma, y lo único que cambia entre personas es el correo:
 *
 *   https://micuenta.donweb.com/es-pe/acceso-remoto/webmail?a=CORREO&id=CUENTA
 *
 * Por eso no se guarda un enlace por usuario: se arma con el correo que ya
 * está cargado. Si el hosting cambia, se toca `config/app.ts` y nada más.
 */
export function enlaceWebmail(email: string | null | undefined): string | null {
  if (!email || !WEBMAIL_CUENTA_ID) return null

  const params = new URLSearchParams({ a: email, id: WEBMAIL_CUENTA_ID })
  return `${WEBMAIL_BASE}?${params.toString()}`
}
