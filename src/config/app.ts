export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * Webmail de Ferozo (DonWeb). Es un Roundcube, y acepta `_user` para dejar el
 * correo escrito en el formulario: cada persona solo pone su contraseña.
 *
 * Ojo con el enlace que da el panel de DonWeb
 * (`micuenta.donweb.com/…/acceso-remoto/webmail`): ese pasa por el login del
 * **panel de cliente**, así que solo funciona para el titular del hosting y
 * no sirve para el equipo. Por eso se apunta al webmail directo.
 *
 * `websydev.site/webmail` redirige acá; si alguna vez cambia el hosting, esto
 * es lo único que hay que tocar, o se pisa con `VITE_WEBMAIL_URL`.
 */
export const WEBMAIL_URL = import.meta.env.VITE_WEBMAIL_URL ?? 'https://ferozo.email/'
