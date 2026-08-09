# Front.md — Contrato de la API para el frontend

API: `admin-proyecto-api` (NestJS) · Actualizado: **2026-08-09**
Rama: `feat/flujo-completo` · Migración `20260809120000` **ya aplicada en producción**.

Este documento cubre el módulo de **proyectos** después de implementar el flujo del
diagrama «Flujo de trabajo (mejorado).drawio», más lo que hay que cambiar en el front
para que no se rompa.

---

## 0. Lo urgente: 3 cambios que rompen el front actual

Si no tocás nada más, tocá esto.

### 1. `tipoProyecto` cambió de valor

| | Antes | Ahora |
|---|---|---|
| Enviar | `"E-commerce"` | **`"Ecommerce"`** (sin guion) |
| Recibir | `"E-commerce"` | **`"Ecommerce"`** |

La columna pasó de texto libre a enum. En la base sigue guardado `"E-commerce"`, pero la
API traduce en las dos direcciones. Mandar `"E-commerce"` ahora devuelve **400**.

Afecta a los **23 proyectos e-commerce** que ya existen: filtros, etiquetas y `<select>`
que comparen contra el string viejo dejan de funcionar.

```js
// Valores válidos, únicos dos
const TIPO_PROYECTO = ['Informativa', 'Ecommerce'];

// Para mostrar
const LABEL_TIPO = { Informativa: 'Web informativa', Ecommerce: 'E-commerce' };
```

### 2. Ya no se pueden saltear etapas

`PATCH /projects/:id` con `estadoProyecto` ahora valida el orden del diagrama y
devuelve **409** si el salto no es legal.

```
Registro → Brief → Taxonomía → Diseño → Desarrollo → Proyecto Finalizado
```

- ✅ Avanzar de a **una** etapa
- ✅ **Retroceder** a cualquier etapa anterior (los ciclos de «volver a presentar»)
- ✅ Quedarse en la misma etapa
- ❌ Saltear hacia adelante → `409`
- ❌ `estadoProyecto: "Archivado"` → `409`, hay que usar `POST /projects/:id/archivar`
- ❌ Salir de `Archivado` por PATCH → `409`, hay que usar `POST /projects/:id/reactivar`

**Excepción:** `Brief → Diseño` (salteando Taxonomía) **sí** vale, pero solo si el
proyecto **no** es e-commerce. Un e-commerce tiene que pasar por Taxonomía.

En un `<select>` de etapas conviene habilitar solo: la actual, la siguiente, y las
anteriores.

### 3. Cuatro rutas ahora dan 403 según el rol

Solo para roles **`Admin`** y **`Owner`**:

- `PUT /projects/:id/plan-cobros`
- `PATCH /projects/:id/cobros/:hito`
- `POST /projects/:id/archivar`
- `POST /projects/:id/reactivar`

Con cualquier otro rol responden `403` con
`{"message": "Esta acción es solo para: Admin, Owner"}`.

El `roleId` viene en la respuesta del login. Roles actuales:
`Admin=3`, `Programador=5`, `Owner=6`, `Ventas=7`, `Diseñador=8`.

> ⚠️ El front **no** debe decidir permisos por sí solo — el back valida igual. Esto es
> solo para no mostrar botones que van a fallar.

---

## 1. Autenticación (sin cambios)

Los tres endpoints son públicos y **todos** necesitan `credentials: 'include'`.

| Ruta | Respuesta |
|---|---|
| `POST /auth/login` | `200` + `{ accessToken, user }` |
| `POST /auth/refresh` | `200` + `{ accessToken, user }` |
| `POST /auth/logout` | **`204` sin body** — no hacer `.json()` |

```jsonc
// POST /auth/login  → body: { "user": "...", "password": "..." }
{
  "accessToken": "eyJ...",
  "user": { "id": 1, "name": "Aaron", "user": "aaron", "roleId": 3, "roleName": "Admin" }
}
```

El refresh token va en una cookie httpOnly con `Path=/auth`; nunca aparece en el body.
El resto de la API pide `Authorization: Bearer <accessToken>` o responde `401`.

Errores: `401` con `Credenciales inválidas`, `Refresh token inválido o expirado`,
`El usuario está desactivado`.

**Recomendación:** un solo refresh en vuelo a la vez (single-flight) y reintentar la
request original una sola vez.

---

## 2. El objeto `Proyecto` que devuelve la API

Todas las rutas de proyectos devuelven este shape (salvo las que se aclaran aparte).
Los campos marcados **NUEVO** no existían antes.

```jsonc
{
  "id": 22,
  "name": "Cliente X",
  "descripcion": "...",
  "comentario": "...",
  "estadoProyecto": "Desarrollo",     // Registro|Brief|Taxonomia|Diseno|Desarrollo|ProyectoFinalizado|Archivado
  "grupo": "A",                        // A|B|C — se calcula solo, ver §3
  "tipoProyecto": "Ecommerce",         // ⚠️ CAMBIÓ: Informativa|Ecommerce|null
  "tecnologia": "WordPress",           // Shopify|WordPress|Personalizado|null
  "estadoPago": "50%",                 // texto libre, ya no es la fuente de verdad
  "seguimientoId": 2,
  "seguimiento": { "id": 2, "name": "Todo bien" },
  "diasSinResponder": "3",             // texto libre, lo carga administración a mano
  "fechaEntrega": "2026-09-30T00:00:00.000Z",

  // Asignados en el registro. No rotan, pero se pueden reasignar.
  "disenadorId": 4,
  "desarrolladorId": 5,
  "disenador":     { "id": 4, "name": "Ana",  "user": "ana",  "roleId": 8 },
  "desarrollador": { "id": 5, "name": "Luis", "user": "luis", "roleId": 5 },

  // Equipo genérico (tabla usuarios_proyectos). Distinto de los dos de arriba.
  "usuarios": [ { "id": 5, "name": "Luis", "user": "luis", "roleId": 5 } ],

  // Bloqueos del cliente
  "materialMarcaRecibido": true,       // frena el paso a Diseño
  "catalogoRecibido": false,           // solo frena la carga de productos
  "hostingContratado": false,          // NUEVO — frena producción, manda a Grupo C

  // Recorrido — NUEVO. El diagrama no les da estado propio: son marcas de tiempo.
  "factibilidadRevisadaAt": null,
  "disenoAprobadoAt": null,
  "productosCargados": false,
  "presentadoAt": null,
  "subidoProduccionAt": null,
  "capacitacionAt": null,

  "rondasCambiosUsadas": 1,
  "fechaUltimoCambioEstado": "2026-08-01T10:00:00.000Z",
  "archivadoAt": null,

  // Plan de cobros. Vacío = proyecto anterior al flujo nuevo (ver §6).
  "cobros": [
    { "id": 1, "hito": "AbonoInicial",     "porcentaje": 50, "cobrado": true,  "fechaCobro": "2026-08-01T..." },
    { "id": 2, "hito": "AprobacionDiseno", "porcentaje": 30, "cobrado": false, "fechaCobro": null },
    { "id": 3, "hito": "Entrega",          "porcentaje": 20, "cobrado": false, "fechaCobro": null }
  ],

  "recordatorios": [                   // NUEVO — solo los PENDIENTES
    { "id": 7, "tipo": "MaterialMarca", "resueltoAt": null, "createdAt": "2026-07-01T..." }
  ],
  "cotizaciones": [                    // NUEVO
    { "id": 2, "motivo": "Cambio de paleta", "aprobada": false, "cobrada": false }
  ],

  "responsable": "desarrollador",      // NUEVO — ya calculado, ver §3
  "diasEsperandoAlCliente": 39,        // NUEVO — o null si la pelota está en Websy

  "createdAt": "...", "updatedAt": "...", "deletedAt": null
}
```

**Todo lo NUEVO es aditivo**: si lo ignorás, nada se rompe. Pero `responsable` y
`diasEsperandoAlCliente` vienen listos para mostrar y te ahorran calcularlos.

---

## 3. Dos campos que ya no se cargan a mano

### `grupo` se calcula solo

Se deriva del bloqueo, en este orden de prioridad:

| Situación | Grupo |
|---|---|
| Falta un cobro **o** falta el hosting | **C** — el pago manda |
| Falta el material de marca | **B** |
| Todo bien, o lo único que falta es el catálogo | **A** — el desarrollo no se detiene |

Mandar `grupo` explícito en el body **sigue funcionando** como salida manual, pero en
general no hace falta: cualquier ruta que cambie un bloqueo lo recalcula sola.

### `responsable` sale de la etapa

| Etapa / situación | Responsable |
|---|---|
| Grupo **B** o **C** (sea cual sea la etapa) | `administracion` |
| Diseño | `disenador` |
| Desarrollo | `desarrollador` |
| Registro, Brief, Taxonomía | `administracion` |

---

## 4. Listados

| Ruta | Qué trae |
|---|---|
| `GET /projects` | Todos los no borrados |
| `GET /projects/programador?id=N` | Grupo A, sin finalizados ni archivados. Con `id` matchea `desarrolladorId` **o** el equipo genérico |
| `GET /projects/diseno?id=N` | Grupo A **y** etapa Diseño. Con `id` matchea solo `disenadorId` |
| `GET /projects/admin` | Grupos B y C, sin archivados. Sí incluye finalizados |
| `GET /projects/archivados` | Solo archivados, más recientes primero |
| `GET /projects/por-archivar` | Los que llevan ≥90 días esperando al cliente |
| `GET /projects/:id` | Uno. `404` si no existe |
| `GET /projects/:id/historial` | Trazabilidad, ascendente |
| `GET /projects/:id/recordatorios` | Todos, abiertos y resueltos, más recientes primero |

> ⚠️ **`por-archivar` cambió de resultado.** Antes listaba cualquier proyecto parado 90
> días, incluidos los de Grupo A con desarrollo activo. Ahora exige que el proyecto esté
> realmente esperando al cliente. **Va a devolver menos proyectos que antes** — eso es lo
> correcto, no un bug.

`GET /:id/historial` devuelve:

```jsonc
[{
  "id": 1, "proyectoId": 22,
  "estadoAnterior": "Diseno", "estadoNuevo": "Desarrollo",
  "grupoAnterior": "B", "grupoNuevo": "A",
  "motivo": "Hito AprobacionDiseno cobrado",
  "createdAt": "2026-08-01T...",
  "usuario": { "id": 1, "name": "Aaron", "user": "aaron" }   // null si el usuario se borró
}]
```

---

## 5. Crear y editar

### `POST /projects`

```jsonc
{
  "name": "Cliente X",                  // requerido
  "descripcion": "...",                 // requerido
  "comentario": "...",                  // requerido
  "seguimientoId": 2,                   // requerido

  "estadoProyecto": "Registro",         // opcional, default "Registro"
  "tipoProyecto": "Ecommerce",          // opcional — Informativa|Ecommerce
  "tecnologia": "Shopify",              // opcional
  "estadoPago": "50%",                  // opcional
  "grupo": "A",                         // opcional — si se omite se calcula solo
  "disenadorId": 4,
  "desarrolladorId": 5,
  "usuariosIds": [5, 6],
  "fechaEntrega": "2026-09-30",         // string ISO-8601 o null
  "diasSinResponder": "3",              // acepta number, se convierte a string

  "materialMarcaRecibido": false,
  "catalogoRecibido": false,
  "hostingContratado": false,

  // Plan de cobros: exactamente 3 ítems, deben sumar 100
  "planCobros": [
    { "hito": "AbonoInicial",     "porcentaje": 50 },
    { "hito": "AprobacionDiseno", "porcentaje": 30 },
    { "hito": "Entrega",          "porcentaje": 20 }
  ],
  "aprobadoPorJefatura": false,         // NUEVO — única forma de bajar el abono del 30%
  "abonoInicialCobrado": true           // NUEVO — marca el abono cobrado en el alta
}
```

**⚠️ El body no admite propiedades desconocidas.** Cualquier campo de más devuelve `400`.

Errores: `400` si el plan no suma 100, si el abono inicial es <30% sin
`aprobadoPorJefatura`, si el seguimiento o algún usuario no existe, o si mandás
`abonoInicialCobrado` sin `planCobros`.

`409` si creás el proyecto **ya adelantado** (`estadoProyecto` distinto de `Registro`) y
no cumple las compuertas de esa etapa — antes se podía crear un proyecto directamente en
`Desarrollo` salteando todo el flujo.

### `PATCH /projects/:id`

Los mismos campos, **todos opcionales**, **menos** `planCobros`, `aprobadoPorJefatura` y
`abonoInicialCobrado` (esos tienen su propia ruta; mandarlos acá da `400`).

Dos reglas que importan:

- **Omitir una clave la deja intacta. Mandarla en `null` o `[]` la borra.**
  `usuariosIds: []` **borra todas las asignaciones** del proyecto.
- `usuariosIds` hace **reemplazo total**: borra los que había y deja exactamente esos.

Errores: `409` si la transición de etapa no es válida (§0.2) o si falta una compuerta
(§6). `400` por validación. `404` si no existe.

### Asignar usuarios — las tres formas

| Objetivo | Cómo |
|---|---|
| **Reemplazar toda la lista** | `PATCH /projects/:id` con `{"usuariosIds": [1,2,3]}` |
| **Agregar sin tocar los existentes** | `POST /projects/:id/usuarios` con `{"usuariosIds": [4]}` |
| **Quitar uno** | `DELETE /projects/:id/usuarios/:usuarioId` |

No hay un `PUT /projects/:id/usuarios`. El «cambiar» es el `PATCH`.

`POST /:id/usuarios` requiere un array **no vacío** e ignora duplicados.
`DELETE` devuelve `404` si ese usuario no estaba asignado.

> Los asignados del registro (`disenadorId`, `desarrolladorId`) son **otra cosa** y se
> cambian por `PATCH`, como cualquier otro campo.

### `DELETE /projects/:id`

Borrado lógico (marca `deletedAt`). Devuelve el proyecto.

---

## 6. Cobros y compuertas

### El plan

Siempre **tres hitos fijos**: `AbonoInicial`, `AprobacionDiseno`, `Entrega`.
Lo variable es el porcentaje. **El sistema no maneja montos en dinero**, solo el % y si
está cobrado.

```
PUT /projects/:id/plan-cobros        (Admin/Owner)
{
  "cobros": [ {"hito":"AbonoInicial","porcentaje":50}, ... ],   // exactamente 3, suman 100
  "aprobadoPorJefatura": false
}

PATCH /projects/:id/cobros/:hito     (Admin/Owner)   :hito = AbonoInicial|AprobacionDiseno|Entrega
{ "cobrado": true, "fechaCobro": "2026-08-09" }      // fechaCobro opcional, default hoy
```

Redefinir el plan cambia los porcentajes pero **respeta lo ya cobrado**.

Errores: `400` si no suman 100 o el abono baja de 30 sin aprobación; `400` si marcás un
hito que no está en el plan; `403` si el rol no es Admin/Owner.

### Las compuertas

Bloquean la **entrada** a una etapa y devuelven `409` con todos los motivos juntos:

| Para entrar a | Hace falta |
|---|---|
| `Brief` | `AbonoInicial` cobrado |
| `Diseno` | material de marca recibido |
| `Desarrollo` | `AprobacionDiseno` cobrado |
| `ProyectoFinalizado` | `Entrega` cobrado + hosting + producción + capacitación |

```jsonc
// 409
{ "message": "No se puede pasar a ProyectoFinalizado: el hito Entrega todavía no está cobrado; el cliente todavía no contrató el hosting" }
```

> 🔑 **Las compuertas solo rigen para proyectos con plan de cobros cargado.**
> Los **52 proyectos que ya existen** tienen `cobros: []`, así que hoy **ninguno se
> traba** y siguen avanzando como siempre. En cuanto administración le cargue un plan a
> uno, ese proyecto pasa a exigir todo lo de la tabla. Vale la pena avisarle al equipo.

---

## 7. Rutas nuevas del recorrido

Todas devuelven el **proyecto completo** actualizado (salvo `rondas-cambio`) y dejan su
fila en el historial.

### Bloqueos del cliente

Body: `{ "recibido": true, "motivo": "opcional" }`

| Ruta | Efecto |
|---|---|
| `PATCH /projects/:id/material-marca` | Habilita el paso a Diseño. Falta → **Grupo B** |
| `PATCH /projects/:id/catalogo` | Solo e-commerce. Falta → sigue en **A** |
| `PATCH /projects/:id/hosting` | Campo `recibido` = contratado. Falta → **Grupo C** |

`catalogo` devuelve `409` si el proyecto no es e-commerce.

### Hitos

Body: `{ "motivo": "opcional" }` (máx. 500 caracteres)

| Ruta | Nodo | Notas |
|---|---|---|
| `POST /projects/:id/factibilidad` | F1 | El desarrollador revisa. **No bloquea nada** |
| `POST /projects/:id/aprobar-diseno` | A9 | `409` si el proyecto no está en Diseño |
| `POST /projects/:id/cargar-productos` | C3 | `409` si no es e-commerce o falta el catálogo |
| `POST /projects/:id/presentar` | B4 | Marca `presentadoAt` |
| `POST /projects/:id/produccion` | B13 | `409` si no hay hosting contratado |
| `POST /projects/:id/capacitacion` | B14 | `409` si no se subió a producción |

### Observaciones de la web (B5/B6)

```
POST /projects/:id/observaciones
{ "detalle": "Cambiar el color del header", "dentroDelAlcance": true }
```

- `dentroDelAlcance: true` → limpia `presentadoAt` para volver a presentar
- `dentroDelAlcance: false` → crea una **cotización adicional** y **el proyecto continúa
  igual** hacia el cobro de entrega (el diagrama no lo frena)
- `409` si el proyecto todavía no se presentó

> No confundir con las rondas de diseño: estas son observaciones sobre la **web ya
> desarrollada**, en la Fase 2.

### Rondas de cambios de diseño (A9b)

```
POST /projects/:id/rondas-cambio     { "motivo": "opcional" }
```

Devuelve un shape **distinto**:

```jsonc
{
  "rondasUsadas": 3,
  "rondasIncluidas": 2,
  "requiereCotizacionAdicional": true,   // se pasó de las 2 incluidas
  "proyecto": { /* proyecto completo */ }
}
```

**No bloquea nada** cuando se agotan: el proyecto sigue como está y se crea una cotización
adicional para que administración la persiga. El caso se maneja internamente.

### Archivar y reactivar

```
POST /projects/:id/archivar     { "motivo": "opcional" }     (Admin/Owner)
POST /projects/:id/reactivar    { "motivo": "opcional" }     (Admin/Owner)
```

`archivar` → `409` si ya está archivado o si está finalizado. Cierra los recordatorios.

`reactivar` devuelve un shape **distinto**:

```jsonc
{
  "porcentajeAReactivar": 25,        // 25% antes del año, 50% desde el año
  "diasArchivado": 120,
  "seRehaceInicioYDiseno": false,    // true con 50%: vuelve a Brief
  "proyecto": { /* proyecto completo */ }
}
```

`409` si el proyecto no está archivado.

---

## 8. Recordatorios

Los cinco del diagrama, **automáticos**: el back abre y cierra el que corresponda solo.
El front no los crea — solo los muestra.

Tipos: `MaterialMarca`, `Catalogo`, `CobroAprobacionDiseno`, `CobroEntrega`, `Hosting`.

**Hay como máximo uno abierto por proyecto.** La prioridad es: cobro → hosting →
material de marca → catálogo. `diasEsperandoAlCliente` sale de ahí.

> No confundir con `GET /recordatorio` (sin `s`), que es la lista de notas sueltas de
> siempre y no tiene relación con proyectos.

---

## 9. Códigos de error

| Código | Cuándo |
|---|---|
| `400` | Validación: campo faltante, tipo incorrecto, **propiedad desconocida en el body**, plan que no suma 100, FK inexistente |
| `401` | Sin token, token inválido o expirado |
| `403` | **NUEVO** — el rol no puede ejecutar esa acción |
| `404` | El proyecto (o el usuario asignado) no existe |
| `409` | **Regla de negocio**: transición inválida, compuerta sin cumplir, ya archivado, no es e-commerce, orden de hitos |

Todos traen `{ "message": "...", "statusCode": N }` con el mensaje **en español, listo
para mostrarle al usuario**. Los `409` de compuertas juntan todos los motivos separados
por `;`.

---

## 10. Checklist para el front

**Obligatorio:**
- [ ] Reemplazar `"E-commerce"` por `"Ecommerce"` en envíos, comparaciones y filtros
- [ ] Etiqueta de display: `Ecommerce` → «E-commerce»
- [ ] Selector de etapa: habilitar solo actual, siguiente y anteriores
- [ ] Sacar `"Archivado"` del selector → usar `POST /:id/archivar`
- [ ] Esconder plan-cobros / cobros / archivar / reactivar si el rol no es Admin u Owner
- [ ] Mostrar el `message` de los `409` (vienen redactados para el usuario)

**Recomendado:**
- [ ] Usar `responsable` y `diasEsperandoAlCliente` en vez de calcularlos
- [ ] Mostrar el recordatorio pendiente en la ficha del proyecto
- [ ] Dejar de mandar `grupo`: se calcula solo
- [ ] Pantalla para el tramo final (presentar → observaciones → producción → capacitación)
- [ ] Mostrar `cotizaciones` pendientes

**Ojo con:**
- [ ] `usuariosIds: []` en el `PATCH` borra todas las asignaciones
- [ ] `por-archivar` devuelve menos proyectos que antes (es lo correcto)
