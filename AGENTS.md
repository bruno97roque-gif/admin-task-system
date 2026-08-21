# Guía para agentes

## Contexto

- Es una SPA interna de Websy Admin en React 19, Vite 8, TypeScript y Tailwind CSS v4; no hay backend ni monorepo en este repositorio.
- El arranque está en `src/main.tsx`; `src/App.tsx` hidrata la sesión y `src/routes/AppRouter.tsx` contiene el árbol de rutas.
- `src/services/api.ts` define endpoints y `src/lib/api.ts` es el único transporte HTTP. El estado de dominio está separado en stores Zustand bajo `src/stores/`.

## Comandos

- Usa pnpm, porque el repositorio incluye `pnpm-lock.yaml`:

  ```bash
  pnpm install
  pnpm lint
  pnpm build
  pnpm dev
  pnpm preview
  ```

- `pnpm build` ejecuta `tsc -b` y luego `vite build`; no hay script ni configuración de tests.
- El desarrollo necesita el backend disponible y `VITE_API_URL` en `.env`; el valor por defecto es `http://localhost:3000` y `.env.example` es la referencia.
- `dist/` es salida generada: no la edites. Para rutas SPA en Vercel, conserva el rewrite catch-all de `vercel.json` hacia `index.html`.

## Arquitectura

- Mantén la separación `pages/` (pantallas), `components/` (UI reutilizable), `stores/` (estado), `services/api.ts` (endpoints), `lib/api.ts` (transporte/sesión) y `utils/` (reglas puras).
- Los imports del router salen de `react-router`, no de `react-router-dom`. TypeScript usa resolución `bundler`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals` y `noUnusedParameters`.
- Tailwind v4 se integra mediante `@tailwindcss/vite`; no existe `tailwind.config.js`. Los tokens están en `src/index.css` y la UI reutilizable propia en `src/components/ui/`.
- Extiende esos componentes UI antes de agregar dependencias; no están instalados Axios, Redux, TanStack Query, Zod ni Vitest.

## API Y Sesión

- Todas las peticiones deben pasar por `apiFetch`: añade `Authorization`, usa `credentials: 'include'`, acepta `204` sin parsear JSON y reintenta una sola vez tras `401` con refresh deduplicado.
- El access token vive solo en memoria. Zustand persiste únicamente el usuario bajo `websy-user`; el refresh token es una cookie `httpOnly` y no debe leerse ni guardarse en storage.
- `main.tsx` registra en `lib/api.ts` el getter del token y los handlers de sesión; conserva esa inyección para evitar una dependencia circular.
- Conserva los mensajes de error del backend, especialmente los `409`: los stores los devuelven como `{ success, error }`.
- La API recibe `tipoProyecto` como `Informativa` o `Ecommerce`; `E-commerce` es solo etiqueta visible.
- El backend valida las transiciones de `estadoProyecto`; usa `src/utils/projectStatus.ts` para mostrar únicamente opciones legales.

## Rutas Y Roles

- `/login` es pública; el resto pasa por `ProtectedRoute` y `RoleGuard` dentro de `AppRouter`.
- `Programador` solo puede acceder a `/proyectos/programador` y `Diseñador` solo a `/proyectos/diseno`. `src/utils/roleAccess.ts` centraliza sus redirecciones y menú.
- Los roles no restringidos tienen el menú completo. Las alertas periódicas de recordatorios se desactivan para `Programador` y `Diseñador`.
- Para proyectos de grupos B/C usa `projectsAdminStore` y `GET /projects/admin`; no reemplaces ese endpoint por filtrar la lista general en el cliente.

## Convenciones

- Conserva el vocabulario de dominio en español. Los componentes exportados suelen ser declaraciones `function`; `App` es la excepción con default export.
- Los controles propios de formulario usan `forwardRef` para integrarse con `react-hook-form`.
- Añade comentarios solo para decisiones no evidentes, no para describir operaciones obvias.
