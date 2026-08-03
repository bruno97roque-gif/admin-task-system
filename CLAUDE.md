# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

NestJS 11 REST API for managing web projects ("admin-proyecto"): projects, their pipeline state, the users assigned to them, roles, and follow-up (`seguimiento`) buckets. Persistence is PostgreSQL via Prisma 7. Package manager is **pnpm**. Deployed to Railway from a Dockerfile.

The domain vocabulary is Spanish (`proyecto`, `seguimiento`, `usuario`, `grupo`) and all user-facing error messages are in Spanish. Keep both conventions when adding code.

`README.md` is the untouched NestJS starter boilerplate — it contains nothing about this project. `docs/auth-contract.md` is real and current: it is the verified client-side contract for the auth/refresh flow, written for whoever implements the frontend.

## Commands

```bash
pnpm install
pnpm start:dev          # watch mode, listens on PORT or 3000
pnpm build              # nest build -> dist/
pnpm start:prod         # node dist/main
pnpm lint               # eslint --fix over {src,apps,libs,test}
pnpm format             # prettier

pnpm test                       # jest (rootDir: src, testRegex .*\.spec\.ts$)
pnpm test -- path/to/file.spec.ts   # single file
pnpm test -- -t "name of test"      # single test by name
```

Prisma has no package.json scripts — invoke the CLI directly. `prisma.config.ts` loads `.env` via `dotenv/config` and points at `prisma/schema.prisma` (migrations in `prisma/migrations`, currently one: `20260731000000_init`).

```bash
pnpm exec prisma migrate dev --name <name>
pnpm exec prisma generate       # regenerates src/lib/generated/prisma
pnpm exec prisma studio
```

### Verification

There are **no tests of any kind** in the repo — no `*.spec.ts`, and `pnpm test:e2e` points at `./test/jest-e2e.json`, which does not exist. With no suite to lean on, the available verification is `pnpm exec tsc --noEmit`, `pnpm lint`, and booting the app: Nest logs a `[RouterExplorer] Mapped {...} route` line per endpoint at startup, which confirms both registration and route ordering. Pass `PORT=<free port>` if a dev server already holds 3000.

Booting also exercises the config wiring: `JWT_SECRET` and `JWT_REFRESH_SECRET` are read with `getOrThrow`, so a missing one fails at startup (secret) or on first refresh (refresh secret).

## Environment

`.env` is gitignored. Read through `@nestjs/config` (`ConfigModule.forRoot({ isGlobal: true })`) except in `PrismaService` and `auth.cookie.ts`, which read `process.env` directly.

| Var | Required | Default |
|---|---|---|
| `DATABASE_URL` | yes | — |
| `JWT_SECRET` | yes (`getOrThrow`) | — |
| `JWT_REFRESH_SECRET` | yes (`getOrThrow`, on refresh) | — |
| `JWT_EXPIRES_IN` | no | `1h` (`lib.module.ts`) |
| `JWT_REFRESH_EXPIRES_IN` | no | `5d` — set in **two** places (`auth.service.ts` for the token, `auth.controller.ts` for the cookie `maxAge`); change both or the cookie outlives the token |
| `CORS_ORIGIN` | no | comma-separated list; unset reflects the request origin |
| `PORT` | no | `3000` |
| `NODE_ENV` | no | `production` switches the refresh cookie to `SameSite=None; Secure` |

## Architecture

### Two top-level layers under `src/`

- `src/lib/` — `LibModule` is `@Global()` and provides/exports `PrismaService`, `Argon2Service`, `JwtService`. It also registers `JwtModule.registerAsync` with the access-token secret/expiry. Because it is global, feature modules do **not** need to import it (most don't; `RolModule` imports it redundantly). Inject these services directly.
- `src/feature/<name>/` — one Nest module per resource, each with `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, and an `entities/` stub. Existing features: `auth`, `user`, `rol`, `projects`, `seguimiento`, `recordatorio`. The `entities/*.ts` classes are empty scaffolding left by the Nest CLI generator; response shapes are expressed as exported TypeScript types on the service instead (e.g. `UserPublico`, `ProyectoCompleto`).

Controllers are thin: they parse `:id` with `ParseIntPipe` and delegate. All business rules, existence checks, and error throwing live in services.

When scaffolding with `nest g resource`, the generator leaves an empty `CreateXDto {}` and stub service methods that return strings. The empty DTO is a trap: with the global `forbidNonWhitelisted` pipe (below) it makes every request body a 400 until the fields are filled in. The generated controller also emits lines over Prettier's print width, which are lint **errors** here — run `pnpm exec eslint src/feature/<name> --fix` after generating. New routes are protected by default (see Auth), so decide deliberately whether the resource needs `@Public()`.

### Routing (Express 5)

Nest 11 runs on Express 5 (`express@5.2.1`, `path-to-regexp@8`), which changes two things worth knowing before adding routes:

- **Optional route params (`@Get('x/:id?')`) are gone** — path-to-regexp v8 removed the `?` suffix and the app throws at boot. For an optional value use a query param instead, as `GET /projects/programador` does with `@Query('id', new ParseIntPipe({ optional: true }))`.
- **Static segments must be declared before `:id`.** `ProjectsController` puts `@Get('programador')` and `@Get('diseno')` above `@Get(':id')`; reversed, Express matches `programador` as an id and the request never reaches the intended handler. There is a comment on those routes saying so — keep it.

Do **not** add a global prefix (`app.setGlobalPrefix`) casually: the refresh cookie is scoped to `Path=/auth`, so moving auth under `/api/auth` silently stops the browser from sending it. `COOKIE_PATH` in `auth.cookie.ts` would have to change with it.

### Auth

Fully wired — access token in the `Authorization` header, refresh token in an httpOnly cookie.

- **Global guard.** `AppModule` registers `{ provide: APP_GUARD, useClass: JwtAuthGuard }`, so **every route is protected by default**. `JwtAuthGuard` (`feature/auth/guards/`) reads `Bearer` from the `Authorization` header, verifies it with the access-token secret, and assigns the payload to **`request.usuario`** (Spanish, not `request.user`). Opt out with `@Public()` (`feature/auth/decorators/public.decorator.ts`), which sets the `isPublic` metadata the guard checks via `Reflector.getAllAndOverride` — it works on a handler or a whole controller.
- **Public routes are only** `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`. Everything else 401s without a token.
- **Two token types, two secrets.** `AuthService` signs the access token with the `LibModule` defaults (`JwtPayload = { sub, user, roleId }`) and the refresh token with `JWT_REFRESH_SECRET` and its own expiry (`RefreshPayload = { sub }`). `JwtService` in `src/lib/jwt` takes optional per-call `options` precisely so the refresh token can override secret and expiry.
- **Refresh re-reads the user from the database** on every call, so a role change or deactivation takes effect on the next refresh. It returns the same shape as login (`accessToken` + `user`), and the response body **never** contains the refresh token — `AuthService` returns `SesionCreada { respuesta, refreshToken }` and the controller peels the refresh token off into the cookie in `enviarSesion()`.
- **Cookie options** live in `auth.cookie.ts`: `httpOnly`, `path=/auth`, and `secure`/`sameSite` keyed off `NODE_ENV === 'production'`. `duracionAMs()` converts `"7d"`/`"12h"`/`"30m"` to the cookie `maxAge` so the cookie expires with the token.
- **CORS is not wide open.** `main.ts` sets `credentials: true`, which forbids `origin: '*'`; it therefore uses the `CORS_ORIGIN` list or reflects the request origin (`origin: true`). `cookie-parser` is installed globally in `main.ts` — without it `req.cookies` is undefined and every refresh 401s.
- **Known limit:** the refresh token is stateless. Logout clears the cookie but the JWT stays cryptographically valid until it expires; there is no server-side revocation. Don't build anything that assumes logout invalidates it.

`docs/auth-contract.md` documents the exact request/response/error shapes and the client-side rules (single-flight refresh, retry-once, the 204 logout that must not be `.json()`-parsed). Update it when the auth surface changes.

### Prisma

- Prisma 7 with the **`prisma-client` generator** (not `prisma-client-js`), output committed at `src/lib/generated/prisma` with `moduleFormat = "cjs"`. Import types and enums from `'../../lib/generated/prisma/client'`, never from `@prisma/client`. The `.gitignore` entry `/generated/prisma` is root-anchored and does not cover this path, so the generated client is checked in — regenerate and commit it after schema changes.
- `PrismaService` extends `PrismaClient` and constructs a `PrismaPg` **driver adapter** from `DATABASE_URL` (Prisma 7 requires an adapter). It does not implement `OnModuleInit`/`onModuleDestroy`.
- Schema uses `@map`/`@@map` throughout: Prisma camelCase fields map to snake_case columns and pluralized Spanish table names (`users`, `proyectos`, `usuarios_proyectos`). Enum values are also mapped (`Diseno` → `"Diseño"`, `ProyectoFinalizado` → `"Proyecto Finalizado"`, `Personalizado` → `"personalizado"`). Always use the **Prisma-side** identifier in code (`estadoProyecto: 'Diseno'`), never the mapped database string.
- `Proyecto` is **soft-deleted** via `deletedAt`. Every read in `ProjectsService` filters `where: { deletedAt: null }` and `remove()` sets the timestamp. Any new project query must do the same. Note `findOne` uses `findFirst`, not `findUnique`, because the soft-delete filter is not part of a unique constraint.
- `UsuarioProyecto` is an explicit many-to-many join table with a composite `@@id([usuarioId, proyectoId])`. `ProjectsService` selects it through a shared `proyectoInclude` constant (typed with `satisfies Prisma.ProyectoInclude`), derives payload types with `Prisma.ProyectoGetPayload`, and flattens `usuarios[].usuario` into a plain `usuarios[]` array in a private `aplanar()` helper before returning.

### Recurring service patterns

Follow these when adding a resource — they are consistent across `rol`, `seguimiento`, `user`, `projects`, and `recordatorio`:

- Private `notFound(id)` returning a `NotFoundException` with a Spanish message.
- Private `rethrow(error, id): never` that converts `Prisma.PrismaClientKnownRequestError` code `P2025` into that `NotFoundException` and rethrows anything else. Used around `update`/`delete`.
- Private `validarX()` helpers that pre-check foreign keys and throw `BadRequestException` ("El rol con id N no existe"), and `ConflictException` for uniqueness violations or refusing to delete a row that still has dependents (`RolService.remove` counts users first).
- Passwords are never returned: queries use Prisma's `omit: { password: true }` (`sinPassword` constant in `UserService`) and `UserService` re-hashes with Argon2id on update when `password` is present. `AuthService` is the only place that selects `password`.

### Validation

- `main.ts` installs a global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`, so any unknown property in a request body is a 400. Every DTO field therefore needs a `class-validator` decorator or it will be stripped/rejected.
- Update DTOs are `PartialType(CreateXDto)` from `@nestjs/mapped-types`.
- Enum fields validate against the generated Prisma enums (`@IsEnum(EstadoProyecto)`), and id arrays use `@IsArray() @ArrayUnique() @IsInt({ each: true })`.

## Deployment (Railway / Docker)

`railway.json` forces `builder: DOCKERFILE` — Nixpacks is deliberately not used. The `Dockerfile` encodes four fixes that will break the deploy if undone; each has a comment above it:

- `FROM node:22` (not `-slim`): `argon2` is a native module and needs gcc/make/python3 when no prebuilt binary matches.
- pnpm is installed with `npm install -g pnpm@11.16.0`, **not corepack** — Railway's build-image corepack predates pnpm 10/11 and fails with `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`.
- `pnpm-workspace.yaml` is copied before install because its `allowBuilds` entries are what authorize `argon2` and `prisma` to run their build scripts.
- `pnpm install --frozen-lockfile --prod=false` — the build needs devDependencies (`@nestjs/cli`, `typescript`) even when the environment sets `NODE_ENV=production`.
- `EXPOSE 3000` is required: with a Dockerfile build, Railway infers the routed port from it and returns 502 without it.

`.nvmrc` pins Node 22 and `package.json` sets `engines.node >= 22.13`.

## TypeScript / lint notes

- `tsconfig.json` uses `module: nodenext`, `strictNullChecks: true` but `noImplicitAny: false` and no full `strict`.
- ESLint runs `recommendedTypeChecked` plus Prettier-as-a-rule, so formatting violations are lint **errors**. Prettier config: single quotes, trailing commas everywhere.
- `baseUrl: "./"` allows `src/...`-prefixed imports (used once in `rol.module.ts`), but the prevailing style is relative paths.

## Vendored skills

`.claude/skills/`, `.agents/skills/`, and `.windsurf/skills/` hold byte-identical copies of the same nine Prisma skill packs (tracked by `skills-lock.json`). If you edit or update one, mirror it to the other two.
