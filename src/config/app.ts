export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * Webmail de DonWeb. El enlace es siempre el mismo salvo el correo, así que
 * se arma en `utils/webmail.ts` en vez de guardarlo por usuario.
 *
 * `WEBMAIL_CUENTA_ID` es el id de la cuenta de hosting: sale del enlace que
 * da el panel de Ferozo (`…/webmail?a=correo&id=ESTE`). Si alguna vez se
 * migra de hosting, esto es lo único que hay que cambiar.
 */
export const WEBMAIL_BASE =
  import.meta.env.VITE_WEBMAIL_BASE ??
  'https://micuenta.donweb.com/es-pe/acceso-remoto/webmail'

export const WEBMAIL_CUENTA_ID = import.meta.env.VITE_WEBMAIL_CUENTA_ID ?? '1229497'
