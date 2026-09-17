import { API_URL } from '../config/app'
import aaron from '../assets/avatars/aaron.webp'
import gustavo from '../assets/avatars/gustavo.webp'
import juancarlos from '../assets/avatars/juancarlos.webp'
import julio from '../assets/avatars/julio.webp'
import luis from '../assets/avatars/luis.webp'
import rubid from '../assets/avatars/rubid.webp'

const AVATAR_BY_USER_ID: Record<number, string> = {
  3: julio,
  11: aaron,
  12: luis,
  13: juancarlos,
  14: rubid,
  16: gustavo,
}

export function getAvatarUrl(userId: number): string | undefined {
  return AVATAR_BY_USER_ID[userId]
}

/**
 * La foto que subió la persona desde su perfil. `v` cambia con cada foto
 * nueva: el API la sirve con caché larga y así nunca se ve una vieja.
 */
export function urlDeFotoSubida(userId: number, version: number): string {
  return `${API_URL}/user/${userId}/foto?v=${version}`
}
