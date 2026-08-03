import { CookieOptions } from 'express';

export const REFRESH_COOKIE = 'refreshToken';

/**
 * La cookie se limita a /auth: solo se manda en login, refresh y logout,
 * no en cada request a la API.
 */
export const COOKIE_PATH = '/auth';

const DURACION_POR_DEFECTO = '7d';

/**
 * Traduce la duración del refresh token ("7d", "12h", "30m", "45s" o segundos
 * sueltos) a milisegundos, para que el maxAge de la cookie caduque a la vez
 * que el propio token y no queden cookies zombis.
 */
export const duracionAMs = (duracion: string): number => {
  const match = /^(\d+)([smhd])?$/.exec(duracion.trim());

  if (!match) {
    return duracionAMs(DURACION_POR_DEFECTO);
  }

  const valor = Number(match[1]);
  const unidades: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return valor * (unidades[match[2] ?? 's'] ?? 1000);
};

export const opcionesCookieRefresh = (duracion: string): CookieOptions => {
  const enProduccion = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    // En producción el front suele estar en otro dominio: SameSite=None exige Secure.
    secure: enProduccion,
    sameSite: enProduccion ? 'none' : 'lax',
    path: COOKIE_PATH,
    maxAge: duracionAMs(duracion),
  };
};
