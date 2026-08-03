# Contexto: autenticación con refresh token (API admin-proyecto)

Documento para pasarle a un asistente (Cursor) que va a implementar el **lado cliente**
del refresh. Describe el contrato **real y ya verificado** de la API; el backend está
implementado y funcionando, no hay que modificarlo.

Stack del backend: NestJS 11 + Express 5. Base URL en desarrollo: `http://localhost:3000`.

---

## 1. Modelo mental

Hay **dos** tokens y viven en sitios distintos:

| | Dónde vive | Quién lo maneja | Vida |
|---|---|---|---|
| **Access token** | Memoria del front (un `ref` de Pinia) | El front lo pone en `Authorization: Bearer` | `JWT_EXPIRES_IN` (1d) |
| **Refresh token** | Cookie `httpOnly` | El navegador, solo | `JWT_REFRESH_EXPIRES_IN` (7d) |

Reglas que salen de esto:

- El access token **nunca** va a `localStorage` ni `sessionStorage` (un XSS lo robaría).
  Al recargar la página se pierde a propósito.
- El refresh token **no se puede leer desde JavaScript**. El front nunca lo toca, no lo
  guarda, no lo manda a mano. Solo lo envía el navegador cuando la petición lleva
  `credentials: "include"`.
- Como el access token se pierde al recargar, el arranque de la app tiene que rehidratar
  la sesión llamando a `/auth/refresh`.

---

## 2. Contrato de la API

### `POST /auth/login` — público

Request:
```json
{ "user": "Ing Jauregui", "password": "..." }
```

Respuesta `200`:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 4, "name": "Aaron", "user": "Ing Jauregui", "roleId": 5, "roleName": "Programador" }
}
```
Además manda el header `Set-Cookie` con el refresh token.

Errores: `401 {"message":"Credenciales inválidas","error":"Unauthorized","statusCode":401}`
y `401 "El usuario está desactivado"`.

> **El campo se llama `accessToken`, NO `token`.** Si partes de una plantilla que usa
> `token`, hay que renombrarlo o el store guardará `undefined`.

### `POST /auth/refresh` — público

- **Sin cuerpo.** No mandes nada en el body ni ningún header `Authorization`.
- **Obligatorio** `credentials: "include"`, o el navegador no manda la cookie y siempre dará 401.
- Es una ruta **pública** a propósito: se llama justo cuando el access token ya expiró.

Respuesta `200`: **exactamente la misma forma que el login** (`accessToken` + `user`), y
una cookie nueva. Sirve para rehidratar el store completo, incluido el rol.

Errores (todos `401`):

| Situación | `message` |
|---|---|
| No llegó la cookie | `Refresh token no proporcionado` |
| Cookie corrupta o expirada | `Refresh token inválido o expirado` |
| El usuario fue borrado | `El usuario ya no existe` |
| El usuario fue desactivado | `El usuario está desactivado` |

Para el cliente todos significan lo mismo: **limpiar sesión y mandar al login.**

### `POST /auth/logout` — público

Responde **`204 No Content`, sin cuerpo**, y borra la cookie.

> **Trampa:** si tu `apiFetch` termina con `return await response.json()`, el logout
> **revienta** — un 204 no tiene cuerpo que parsear y `.json()` lanza `SyntaxError`.
> Hay que devolver antes cuando `response.status === 204`, o llamar al logout con `fetch`
> directo.

### Rutas protegidas — todo lo demás

`/projects`, `/user`, `/rol`, `/seguimiento`, `/recordatorio`. Requieren
`Authorization: Bearer <accessToken>`. Un guard global protege todo salvo las tres rutas
de `/auth` de arriba.

Errores: `401 "Token no proporcionado"` (falta el header o el esquema no es `Bearer`) y
`401 "Token inválido o expirado"`.

---

## 3. Lo que hay que implementar en el cliente

### 3.1 Rotación: guarda SIEMPRE lo que devuelve el refresh

Cada refresh emite **un par nuevo** y reemplaza la cookie (reiniciando los 7 días). El
backend además **relee el usuario de la base** en cada refresh, así que el `user` que
vuelve está fresco: si le cambiaron el rol, llega actualizado. Por eso hay que meter la
respuesta entera en el store, no solo el `accessToken`.

### 3.2 Anti-bucle: refrescar UNA sola vez

`apiFetch` recibe un tercer parámetro `retry = true`. Al recibir 401 intenta refrescar
**una vez**; el reintento se hace con `retry = false`, de modo que un 401 en el reintento
ya no dispara otro refresh. Sin esto, un refresh que falla provoca recursión infinita.

### 3.3 Dedupe: una sola llamada de refresh concurrente

Una `refreshPromise` a nivel de módulo. Si cinco peticiones dan 401 a la vez, las cinco
esperan **la misma** llamada a `/auth/refresh`. Limpiar con `.finally()`.

Esto no es un lujo: sin dedupe, las cinco refrescan en paralelo, cada una rota la cookie
y las respuestas se pisan entre sí.

### 3.4 Una única fuente de refresh

La lógica vive **solo** en `refreshSession()` dentro de `api.ts`. El arranque de la app y
cualquier otro sitio la **importan**; no se reimplementa.

### 3.5 Rehidratar al cargar

En `onMounted` de `App.vue`: si ya hay sesión, no hacer nada; si no, llamar a
`refreshSession()` y mandar al login solo si falla.

### 3.6 Todo pasa por `apiFetch`

Nada de `fetch` suelto en componentes o composables: si una petición se salta `apiFetch`,
se salta el refresh automático.

---

## 4. Configuración

**Front:** `VITE_API_URL` apuntando a la API.

**Back (ya hecho, para que lo sepas):** `credentials: true` en CORS. Con credenciales el
navegador **prohíbe** `Access-Control-Allow-Origin: *`, por eso el backend refleja el
origen o usa la lista de `CORS_ORIGIN`. Si el front se queja de CORS al llamar al refresh,
el origen es lo primero que hay que mirar.

**Cookie:** sale con `HttpOnly; Path=/auth; Max-Age=604800; SameSite=Lax` (verificado).

- `Path=/auth` → la cookie solo viaja a `/auth/*`, no en cada `GET /projects`.
  Si algún día pones la API tras un prefijo (`/api/auth/...`), hay que ajustar el path en
  el backend o la cookie dejará de enviarse.
- En desarrollo, `localhost:5173` → `localhost:3000` es *same-site* (el puerto no cuenta),
  así que `SameSite=Lax` funciona sin HTTPS.
- En producción el backend cambia a `SameSite=None; Secure`, lo que **exige HTTPS** en
  ambos lados. Sobre `http://` la cookie se descarta en silencio.

---

## 5. Límite conocido

El refresh token es un JWT *stateless*: el logout borra la cookie del navegador, pero el
token sigue siendo criptográficamente válido hasta que expire. No hay revocación en
servidor (haría falta persistirlo en base). No construyas nada asumiendo que el logout
invalida el token del lado del servidor.

---

## 6. Checklist

- [ ] La interfaz de respuesta usa `accessToken` (no `token`).
- [ ] Todas las llamadas llevan `credentials: "include"`.
- [ ] El access token solo en memoria; nada en `localStorage`.
- [ ] El refresh se intenta una sola vez por petición (`retry = false` en el reintento).
- [ ] `refreshPromise` compartida y limpiada en `.finally()`.
- [ ] El 204 del logout no se pasa por `.json()`.
- [ ] La respuesta del refresh se guarda entera (token **y** user).
- [ ] Rehidratación al montar la app.
- [ ] Guard de router basado en el estado de sesión del store.
