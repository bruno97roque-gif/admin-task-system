import { esAdministracion } from './roleAccess'

/**
 * Websy tiene dos dominios de correo y el rol decide cuál le toca a cada uno:
 * administración usa el de Google Workspace y el resto del equipo el del
 * hosting de DonWeb, que es el que se abre con el botón de webmail.
 *
 * Importa más de lo que parece: este correo es el que recibe la invitación
 * del evento de Google Calendar, así que cargarlo con el dominio equivocado
 * deja a la persona sin invitación.
 */
export const DOMINIO_ADMINISTRACION = 'websy.com.pe'
export const DOMINIO_EQUIPO = 'websydev.site'

export function dominioCorporativo(roleName: string | null | undefined): string {
  return esAdministracion(roleName ?? undefined)
    ? DOMINIO_ADMINISTRACION
    : DOMINIO_EQUIPO
}

/** Ejemplo para el placeholder, con el dominio que le corresponde al rol. */
export function ejemploDeCorreo(roleName: string | null | undefined): string {
  return `nombre@${dominioCorporativo(roleName)}`
}
