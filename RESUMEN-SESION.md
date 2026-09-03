# Resumen de la sesión — Websy Admin

Repaso de todo lo que se hizo, en dos repos: **admin-task-system** (front) y
**admin-task-api** (backend). Cada punto linkea al PR correspondiente para
ver el detalle/diff.

---

## Backend (`admin-task-api`)

### Notificaciones a Discord — [PR #3](https://github.com/bruno97roque-gif/admin-task-api/pull/3), [PR #4](https://github.com/bruno97roque-gif/admin-task-api/pull/4)

Webhook entrante, sin bot. Manda un mensaje al canal en 4 casos:

- Un proyecto llega a una etapa **Finalizado** (Diseño, Desarrollo o Proyecto Finalizado).
- Un proyecto se **archiva**.
- El **"Estado pago"** sube por encima del 50% (ej. 50%→80%, 50%→100%) — el 50% inicial no avisa porque es el punto de partida de la mayoría de los proyectos.

Se activa solo si existe la variable de entorno `DISCORD_WEBHOOK_URL` en Railway; sin ella, el feature queda apagado sin romper nada.

### Analítica — [PR #3](https://github.com/bruno97roque-gif/admin-task-api/pull/3)

Nuevo endpoint `GET /projects/analitica`: cierres de diseño/desarrollo por mes, leaderboard por diseñador/desarrollador, y duración promedio en cada etapa (desde la primera entrada hasta el primer cierre, calculado sobre `historial_etapas`).

### Auditoría completa — [PR #3](https://github.com/bruno97roque-gif/admin-task-api/pull/3)

`asignarUsuarios`, `quitarUsuario` y `remove` ahora también dejan rastro en el historial (antes no quedaba registro de quién hizo esas tres acciones).

### Archivados enriquecidos — [PR #3](https://github.com/bruno97roque-gif/admin-task-api/pull/3)

`findArchivados()` devuelve también `etapaAlArchivar`: la etapa en la que estaba el proyecto justo antes de archivarse (leída del historial), para poder reactivarlo a su lugar correcto.

---

## Frontend (`admin-task-system`)

### Marca y estilo — [PR #1](https://github.com/bruno97roque-gif/admin-task-system/pull/1)

- Colores reales de Websy: fondo morado oscuro (`#291231`), acento naranja (`#f18c1b`) en vez del morado/azul anterior.
- Favicon con la W naranja — corregido después para que sea cuadrado de verdad ([PR #2](https://github.com/bruno97roque-gif/admin-task-system/pull/2)), sin estirarse en la pestaña.
- Fotos reales del equipo como avatar, gif de fogata como estado vacío de "Recordatorios activos" ([PR #7](https://github.com/bruno97roque-gif/admin-task-system/pull/7), agrandado y sin poder arrastrarse en [PR #8](https://github.com/bruno97roque-gif/admin-task-system/pull/8)).
- Íconos de tecnología (WordPress/Shopify/Personalizado) y tipo de proyecto (E-commerce/Informativa/Sistema) en color, tamaño y blanco según cada caso.

### Tarjetas de proyecto compartidas — [PR #1](https://github.com/bruno97roque-gif/admin-task-system/pull/1)

`ProjectCard`/`ProjectColumn`/`ProjectDetails` extraídos de la duplicación entre Developers y Diseñadores. Tarjetas compactas, filtros combinables, reordenamiento manual por drag-and-drop (persistido en `localStorage`).

### Vista Global — [PR #1](https://github.com/bruno97roque-gif/admin-task-system/pull/1), [PR #3](https://github.com/bruno97roque-gif/admin-task-system/pull/3), [PR #5](https://github.com/bruno97roque-gif/admin-task-system/pull/5)

Kanban por etapa de todo el flujo activo (sin Proyecto Finalizado, que tiene su propia ventana). Admin/Owner ven todo; Developers ven sus proyectos en toda su vida; Diseñadores solo de Brief a Diseño Finalizado. Botón para mostrar/ocultar Grupo B/C ("congelados").

- **Colores por persona**: cada diseñador/desarrollador tiene un color fijo (Juan Carlos=rojo, Gustavo=azul, Luis=naranja, Rubid=celeste, Aaron=verde) — el punto de color de cada tarjeta sigue al diseñador en las etapas de diseño y al desarrollador en el resto, cambiando de significado al pasar de etapa.
- **Click en una tarjeta abre el editor** — se extrajo el modal de edición a un componente compartido (`ProjectEditModal`) reutilizado también en las tablas.

### Proyectos / Finalizados / En espera (tabla) — [PR #2](https://github.com/bruno97roque-gif/admin-task-system/pull/2), [PR #3](https://github.com/bruno97roque-gif/admin-task-system/pull/3), [PR #6](https://github.com/bruno97roque-gif/admin-task-system/pull/6), [PR #7](https://github.com/bruno97roque-gif/admin-task-system/pull/7)

- Filtro **"Ordenar por"** (por defecto, más antiguo, más nuevo, alfabético) y ancho completo en pantallas grandes.
- **"Estado proyecto"** con color por etapa (igual que los tableros) en vez de un naranja genérico; "Proyecto Finalizado" se acorta a "Finalizado" para que no corte en dos líneas.
- **Grupo A/B/C** con color (verde/naranja/rojo) en la tabla y en las tarjetas de los tableros.
- **Usuarios** con el mismo punto de color por persona que Vista Global.
- Íconos de tipo de proyecto y tecnología también en la tabla.
- **Orden "Por defecto" por jerarquía**, no el orden crudo de la API: Desarrollo → Diseño → Avance de Diseño → Brief → Taxonomía → Registro → Finalizados al fondo. Desempate dentro de la misma etapa: el proyecto más antiguo en su Grupo actual va primero.
- **"Eliminar" pasa a "Archivar"** en Proyectos y En espera (reversible, manda a la nueva ventana de Archivados). Finalizados mantiene "Eliminar" real porque el backend no deja archivar un Proyecto Finalizado.

### Archivados (ventana nueva) — [PR #7](https://github.com/bruno97roque-gif/admin-task-system/pull/7)

No existía ninguna pantalla para ver proyectos archivados. Ahora `/archivados` los lista con la etapa previa al archivado, y desde ahí se puede **Reactivar** o **Eliminar definitivamente**.

### Developers y Diseñadores (tableros canvas) — [PR #1](https://github.com/bruno97roque-gif/admin-task-system/pull/1), [PR #8](https://github.com/bruno97roque-gif/admin-task-system/pull/8), [PR #9](https://github.com/bruno97roque-gif/admin-task-system/pull/9), [PR #10](https://github.com/bruno97roque-gif/admin-task-system/pull/10)

- Renombrados: "Por programador" → "Asignaciones" → **"Developers"**; "Por diseño" → **"Diseñadores"**. Ícono de Developers cambiado a `</>`.
- **Developers ahora solo muestra Desarrollo, Brief, Taxonomía y Desarrollo Finalizado** (antes mostraba todo el ciclo de vida, igual que Vista Global). Diseñadores y Vista Global no cambiaron.
- **Botón "Restablecer orden"**: borra el orden manual (drag) guardado y las tarjetas vuelven a la jerarquía por defecto — animado (FLIP manual), no de golpe.
- **Drag solo vertical**: una tarjeta ya no se puede arrastrar fuera de su propia columna.
- Fotos de avatar ya no se pueden arrastrar como imagen suelta.

### Dashboard — [PR #7](https://github.com/bruno97roque-gif/admin-task-system/pull/7), [PR #8](https://github.com/bruno97roque-gif/admin-task-system/pull/8)

- Menú lateral reordenado: Dashboard, Proyectos, Vista Global, En espera, Developers, Diseñadores, Finalizados, Analítica, Usuarios, Roles, Recordatorios, Archivados.
- Tarjetas de estadísticas rehechas para ser simétricas (alto fijo, texto trunca en vez de envolver a dos líneas).
- **"Usuarios"/"Roles" reemplazadas por "Programadores"/"Diseñadores"**: muestran cuántos proyectos hay activos en Desarrollo y en Diseño/Avance de Diseño respectivamente, no un conteo de usuarios.
- **"Proyectos finalizados"** corregido: llevaba a Proyectos en vez de a Finalizados.
- **"Proyectos recientes"** mostraba siempre los mismos 5 (los primeros por ID). Ahora ordena por última modificación, con la fecha de cada cambio.
- Tarjeta de "Recordatorios activos" con fondo propio (`#222034`) y el gif de descanso centrado, más grande, también sin poder arrastrarse.

### Analítica — [PR #1](https://github.com/bruno97roque-gif/admin-task-system/pull/1)

Nueva página: cierres de diseño/desarrollo por mes (gráfico), leaderboard por diseñador/desarrollador, duración promedio en cada etapa — consume el endpoint nuevo del backend.

---

## Notas para seguir

- El PR [#10](https://github.com/bruno97roque-gif/admin-task-system/pull/10) (Taxonomía en Developers) queda pendiente de mergear.
- La notificación de Discord por cobro terminó usando el campo libre **"Estado pago"** (porcentaje) en vez del sistema de hitos estructurado del backend, porque ese sistema nunca tuvo pantalla propia en el front.
- Hay que agregar `DISCORD_WEBHOOK_URL` en Railway si todavía no está (ya se probó en vivo que funciona una vez configurada).
