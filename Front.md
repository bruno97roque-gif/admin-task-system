# Front.md — cambios necesarios en el front

> **Contexto:** el enum `EstadoProyecto` pasó de 7 a 9 valores. El tramo de diseño, que
> antes era una sola etapa, ahora son tres. La migración ya está aplicada en la base de
> producción y la API ya devuelve los valores nuevos.
>
> Fecha: **2026-08-12** · Rama de la API: `feat/flujo-completo`

---

## 1. Sí, hay que tocar el front. Esto es lo mínimo

- [ ] Agregar `AvanceDiseno` y `DisenoFinalizado` a la lista de estados (dropdowns, filtros, tablero, badges, colores).
- [ ] Mapear valor → etiqueta: el JSON manda `"AvanceDiseno"`, el usuario tiene que leer **«Avance de Diseño»**.
- [ ] Cambiar todo `estadoProyecto === 'Diseno'` por una comprobación sobre las **tres** etapas.
- [ ] Ajustar el selector de etapa: ahora **no se puede saltar de `Diseno` a `Desarrollo`** en un paso. Devuelve `409`.
- [ ] Revisar el orden con el que se ordenan/pintan las etapas: hay dos posiciones nuevas en el medio.

Nada de esto rompe lo que ya existe: **no se eliminó ningún valor**. Un proyecto que hoy
está en `Diseno` sigue en `Diseno` y sigue funcionando igual. El riesgo real es el
contrario: pantallas que **no** conozcan los valores nuevos y los muestren vacíos, en
blanco o los tiren a un `default`.

---

## 2. Los valores nuevos

⚠️ **El valor que viaja por JSON no es el que se muestra.** La base guarda `"Avance de
Diseño"` (con ñ y espacios) pero la API traduce y **siempre** manda el identificador de
Prisma. Verificado contra producción, ida y vuelta.

| Valor en el JSON (usar este) | Etiqueta para mostrar | Estado |
|---|---|---|
| `Registro` | Registro | — |
| `Brief` | Brief | — |
| `Taxonomia` | Taxonomía | — |
| `Diseno` | Diseño | ya existía, **no se tocó** |
| `AvanceDiseno` | **Avance de Diseño** | 🆕 |
| `DisenoFinalizado` | **Diseño Finalizado** | 🆕 |
| `Desarrollo` | Desarrollo | — |
| `ProyectoFinalizado` | Proyecto Finalizado | — |
| `Archivado` | Archivado | — |

Sin `ñ`, sin espacios y sin acentos en el valor: `AvanceDiseno`, no `"Avance de Diseño"`.
Si mandás el string de la base en un `PATCH`, la API responde **400** (`estadoProyecto must
be one of the following values: ...`).

El orden de la tabla es el orden del pipeline. Si en algún lado ordenás las etapas por un
índice hardcodeado, hay que reacomodarlo: las dos nuevas van **entre `Diseno` y
`Desarrollo`**.

---

## 3. La máquina de estados: qué acepta ahora `PATCH /projects/:id`

Esto es lo que más se puede romper. La regla no cambió, pero el camino se hizo más largo.

```
Registro → Brief → Taxonomia → Diseno → AvanceDiseno → DisenoFinalizado → Desarrollo → ProyectoFinalizado
```

**Reglas de movimiento:**

| Movimiento | ¿Se puede? |
|---|---|
| Quedarse en la misma etapa | ✅ |
| Avanzar **una** etapa | ✅ |
| Retroceder (una o varias) | ✅ — el flujo tiene ciclos de «volver a presentar» |
| Avanzar salteando etapas | ❌ `409` |
| `Brief → Diseno` (saltea taxonomía) | ✅ solo si el proyecto **no** es e-commerce |
| Entrar o salir de `Archivado` con un `PATCH` | ❌ `409` — se usan `POST /:id/archivar` y `/:id/reactivar` |

**El caso que se rompe:** una pantalla que hoy mueve un proyecto de `Diseno` a
`Desarrollo` de una sola vez ahora recibe:

```json
{
  "statusCode": 409,
  "message": "No se puede saltar de Diseno a Desarrollo: hay que pasar por AvanceDiseno",
  "error": "Conflict"
}
```

La forma correcta es ofrecer **solo la etapa siguiente** (y las anteriores, si querés
permitir retroceder). El mensaje del `409` viene en español y ya dice por dónde hay que
pasar: es mostrable tal cual en un toast.

---

## 4. Endpoints afectados

### `GET /projects/diseno` — el tablero del diseñador

**Cambió lo que devuelve.** Antes traía solo los proyectos en `Diseno`; ahora trae el
tramo de diseño entero: `Diseno`, `AvanceDiseno` y `DisenoFinalizado` (siempre en Grupo
A). El filtro `?id=<disenadorId>` sigue igual.

Si la pantalla asumía que *todos* los elementos de esa lista estaban en `Diseno`, ahora
son tres estados distintos: conviene mostrar el badge de etapa, o partirla en tres
columnas tipo kanban.

### `POST /projects/:id/aprobar-diseno`

Ahora se acepta desde **cualquiera** de las tres etapas de diseño (antes solo desde
`Diseno`). El botón se puede habilitar en las tres. Si el proyecto está fuera del tramo:

```json
{ "statusCode": 409, "message": "El proyecto 24 no está en diseño: está en Desarrollo" }
```

### `GET /projects/programador`

No cambió su lógica (Grupo A, todo lo no terminal), pero **ahora también van a aparecer
ahí proyectos en `AvanceDiseno` y `DisenoFinalizado`**, igual que antes aparecían los que
estaban en `Diseno`. Si la vista pinta la etapa, tiene que conocer los valores nuevos.

### `GET /projects/:id/historial`

Las filas de historial pueden traer los valores nuevos en `estadoAnterior` y
`estadoNuevo`. Mismo mapeo de etiquetas.

### El campo `responsable` (viene en toda respuesta de proyecto)

Se calcula en el back, el front solo lo muestra. Las tres etapas de diseño devuelven
`"disenador"`, así que **no hay nada que cambiar** — pero si el front replicaba ese
cálculo por su cuenta, hay que actualizarlo o, mejor, borrarlo y usar el campo.

---

## 5. Snippet para copiar

```ts
export const ESTADO_PROYECTO = {
  Registro: 'Registro',
  Brief: 'Brief',
  Taxonomia: 'Taxonomia',
  Diseno: 'Diseno',
  AvanceDiseno: 'AvanceDiseno',
  DisenoFinalizado: 'DisenoFinalizado',
  Desarrollo: 'Desarrollo',
  ProyectoFinalizado: 'ProyectoFinalizado',
  Archivado: 'Archivado',
} as const;

export type EstadoProyecto =
  (typeof ESTADO_PROYECTO)[keyof typeof ESTADO_PROYECTO];

/** Etiquetas para mostrar. El valor del JSON no lleva ñ ni espacios. */
export const ETIQUETA_ESTADO: Record<EstadoProyecto, string> = {
  Registro: 'Registro',
  Brief: 'Brief',
  Taxonomia: 'Taxonomía',
  Diseno: 'Diseño',
  AvanceDiseno: 'Avance de Diseño',
  DisenoFinalizado: 'Diseño Finalizado',
  Desarrollo: 'Desarrollo',
  ProyectoFinalizado: 'Proyecto Finalizado',
  Archivado: 'Archivado',
};

/**
 * El pipeline en orden. `Archivado` queda afuera a propósito: es lateral, se
 * entra y se sale por sus propias rutas.
 */
export const ORDEN_ETAPAS: EstadoProyecto[] = [
  'Registro',
  'Brief',
  'Taxonomia',
  'Diseno',
  'AvanceDiseno',
  'DisenoFinalizado',
  'Desarrollo',
  'ProyectoFinalizado',
];

/** El tramo de diseño. Usar esto en vez de comparar contra 'Diseno' solo. */
export const ETAPAS_DISENO: EstadoProyecto[] = [
  'Diseno',
  'AvanceDiseno',
  'DisenoFinalizado',
];

export const esEtapaDeDiseno = (estado: EstadoProyecto) =>
  ETAPAS_DISENO.includes(estado);

/**
 * Las etapas a las que la API va a dejar mover el proyecto: la siguiente y
 * todas las anteriores. Sirve para armar el `<select>` sin comerse un 409.
 *
 * No contempla las dos excepciones por tipo de proyecto (ver §6); si el
 * proyecto es informativo o e-commerce, filtrar `Taxonomia` según corresponda.
 */
export function etapasPermitidas(actual: EstadoProyecto): EstadoProyecto[] {
  const i = ORDEN_ETAPAS.indexOf(actual);
  if (i === -1) return []; // Archivado: solo se sale por POST /:id/reactivar
  return ORDEN_ETAPAS.slice(0, i + 2);
}
```

---

## 6. Detalles que conviene tener a mano

**Las dos bifurcaciones por `tipoProyecto` no cambiaron**, pero se cruzan con el selector
de etapas:

- `Informativa` → **no puede** entrar a `Taxonomia` (409), y puede saltar `Brief → Diseno`.
- `Ecommerce` → **tiene que** pasar por `Taxonomia` antes del diseño.
- `tipoProyecto: null` (proyectos viejos) → no se lo fuerza a ninguna rama.

**Las compuertas siguen igual, con un solo agregado:** el material de marca ahora frena la
entrada a **las tres** etapas de diseño, no solo a la primera. El error es un `409`:

```
No se puede pasar a AvanceDiseno: falta el material de marca (logo, fotos de banners y secciones)
```

Ojo con esto: **las compuertas solo rigen para proyectos con plan de cobros cargado.** Hoy
la tabla `cobros` está vacía en producción, así que ninguno de los 53 proyectos que ya
existen se traba con nada. Van a empezar a aparecer cuando administración cargue planes de
cobro.

**El cobro de aprobación de diseño no bloquea el tramo de diseño.** Se sigue exigiendo
para entrar a `Desarrollo`, no antes: el avance y las rondas de cambios van incluidos en
el abono inicial. Lo que sí se corrió es el recordatorio — el de `CobroAprobacionDiseno`
ahora se abre recién cuando el proyecto llega a `DisenoFinalizado`, no durante todo el
diseño. Si el front muestra recordatorios abiertos, va a notar que ese aparece más tarde
que antes.

---

## 7. Lo que **no** cambió

Para que nadie salga a tocar de más:

- No se eliminó ni se renombró ningún valor. `Diseno` sigue existiendo tal cual.
- **Ningún proyecto cambió de estado.** Los 7 que estaban en `Diseño` siguen en `Diseño`.
- No cambió la forma de la respuesta: los mismos campos, los mismos nombres.
- No cambió ninguna URL, ni el contrato de auth, ni los permisos por rol.
- `GET /projects/admin`, `/archivados` y `/por-archivar` funcionan igual que antes.

---

## 8. Cómo probarlo

Con un proyecto de prueba en `Diseno`:

```bash
# 1. Avanza un paso: 200
curl -X PATCH .../projects/<id> -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' -d '{"estadoProyecto":"AvanceDiseno"}'

# 2. Saltea: 409 «hay que pasar por DisenoFinalizado»
curl -X PATCH .../projects/<id> -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' -d '{"estadoProyecto":"ProyectoFinalizado"}'

# 3. Retrocede: 200
curl -X PATCH .../projects/<id> -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' -d '{"estadoProyecto":"Diseno"}'

# 4. El tablero del diseñador ahora trae las tres etapas
curl .../projects/diseno -H 'Authorization: Bearer <token>'
```

Y el checkeo rápido de que no quedó nada sin mapear: buscar en el front
`'Diseno'`, `"Diseño"` y `estadoProyecto` a ver dónde se compara o se pinta.
