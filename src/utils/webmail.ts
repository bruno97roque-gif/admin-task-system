import { WEBMAIL_URL } from '../config/app'

/**
 * Acceso al webmail con el correo ya escrito. Es un Roundcube: `_user` deja
 * el usuario cargado en el formulario y a la persona solo le queda poner su
 * contraseña.
 *
 * No se guarda un enlace por usuario porque el webmail es el mismo para todo
 * el dominio; lo único que cambia es el correo, que ya está en su ficha.
 */
export function enlaceWebmail(email: string | null | undefined): string | null {
  if (!email) return null

  const url = new URL(WEBMAIL_URL)
  url.searchParams.set('_user', email)
  return url.toString()
}
