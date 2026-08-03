# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

NestJS 11 REST API for managing web projects ("admin-proyecto"): projects, their pipeline state, the users assigned to them, roles, and follow-up (`seguimiento`) buckets. Persistence is PostgreSQL via Prisma 7. Package manager is **pnpm**.

The domain vocabulary is Spanish (`proyecto`, `seguimiento`, `usuario`, `grupo`) and all user-facing error messages are in Spanish. Keep both conventions when adding code.

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

Prisma has no package.json scripts — invoke the CLI directly. `prisma.config.ts` loads `.env` via `dotenv/config` and points at `prisma/schema.prisma`.

```bash
pnpm exec prisma migrate dev --name <name>
pnpm exec prisma generate       # regenerates src/lib/generated/prisma
pnpm exec prisma studio
```

Required env vars (`.env`, gitignored): `DATABASE_URL`, `JWT_SECRET`, optional `JWT_EXPIRES_IN` (defaults `1d`), optional `PORT`.

Note: `pnpm test:e2e` points at `./test/jest-e2e.json`, which does not exist — there are currently no tests of any kind in the repo. With no suite to lean on, the available verification is `pnpm exec tsc --noEmit`, `pnpm lint`, and booting the app: Nest logs a `[RouterExplorer] Mapped {...} route` line per endpoint at startup, which confirms both registration and route ordering. Pass `PORT=<free port>` if a dev server already holds 3000.

## Architecture

### Two top-level layers under `src/`

- `src/lib/` — `LibModule` is `@Global()` and provides/exports `PrismaService`, `Argon2Service`, `JwtService`. Because it is global, feature modules do **not** need to import it (most don't; `RolModule` imports it redundantly). Inject these services directly.
- `src/feature/<name>/` — one Nest module per resource, each with `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, and an `entities/` stub. Existing features: `auth`, `user`, `rol`, `projects`, `seguimiento`, `recordatorio`. The `entities/*.ts` classes are empty scaffolding left by the Nest CLI generator; response shapes are expressed as exported TypeScript types on the service instead (e.g. `UserPublico`, `ProyectoCompleto`).

Controllers are thin: they parse `:id` with `+id` and delegate. All business rules, existence checks, and error throwing live in services.

When scaffolding with `nest g resource`, the generator leaves an empty `CreateXDto {}` and stub service methods that return strings. The empty DTO is a trap: with the global `forbidNonWhitelisted` pipe (below) it makes every request body a 400 until the fields are filled in. The generated controller also emits lines over Prettier's print width, which are lint **errors** here — run `pnpm exec eslint src/feature/<name> --fix` after generating.

### Routing (Express 5)

Nest 11 runs on Express 5 (`express@5.2.1`, `path-to-regexp@8`), which changes two things worth knowing before adding routes:

- **Optional route params (`@Get('x/:id?')`) are gone** — path-to-regexp v8 removed the `?` suffix and the app throws at boot. For an optional value use a query param instead, as `GET /projects/programador` does with `@Query('id', new ParseIntPipe({ optional: true }))`.
- **Static segments must be declared before `:id`.** `ProjectsController` puts `@Get('programador')` above `@Get(':id')`; reversed, Express matches `programador` as an id and the request never reaches the intended handler. There is a comment on that route saying so — keep it.

Prefer `ParseIntPipe` over the prevailing `+id` when a param is optional: `+undefined` is `NaN`, which is falsy and slips through truthiness checks silently.

### Prisma

- Prisma 7 with the **`prisma-client` generator** (not `prisma-client-js`), output committed at `src/lib/generated/prisma` with `moduleFormat = "cjs"`. Import types and enums from `'../../lib/generated/prisma/client'`, never from `@prisma/client`. The `.gitignore` entry `/generated/prisma` is root-anchored and does not cover this path, so the generated client is checked in — regenerate and commit it after schema changes.
- `PrismaService` extends `PrismaClient` and constructs a `PrismaPg` **driver adapter** from `DATABASE_URL` (Prisma 7 requires an adapter). It does not implement `OnModuleInit`/`onModuleDestroy`.
- Schema uses `@map`/`@@map` throughout: Prisma camelCase fields map to snake_case columns and pluralized Spanish table names (`users`, `proyectos`, `usuarios_proyectos`). Enum values are also mapped (`Diseno` → `"Diseño"`, `ProyectoFinalizado` → `"Proyecto Finalizado"`, `Personalizado` → `"personalizado"`).
- `Proyecto` is **soft-deleted** via `deletedAt`. Every read in `ProjectsService` filters `where: { deletedAt: null }` and `remove()` sets the timestamp. Any new project query must do the same.
- `UsuarioProyecto` is an explicit many-to-many join table with a composite `@@id([usuarioId, proyectoId])`. `ProjectsService` selects it through a shared `proyectoInclude` constant (typed with `satisfies Prisma.ProyectoInclude`), derives payload types with `Prisma.ProyectoGetPayload`, and flattens `usuarios[].usuario` into a plain `usuarios[]` array in a private `aplanar()` helper before returning.

### Recurring service patterns

Follow these when adding a resource — they are consistent across `rol`, `seguimiento`, `user`, `projects`, and `recordatorio`:

- Private `notFound(id)` returning a `NotFoundException` with a Spanish message.
- Private `rethrow(error, id): never` that converts `Prisma.PrismaClientKnownRequestError` code `P2025` into that `NotFoundException` and rethrows anything else. Used around `update`/`delete`.
- Private `validarX()` helpers that pre-check foreign keys and throw `BadRequestException` ("El rol con id N no existe"), and `ConflictException` for uniqueness violations or refusing to delete a row that still has dependents.
- Passwords are never returned: queries use Prisma's `omit: { password: true }` (`sinPassword` constant in `UserService`).

### Validation and auth

- `main.ts` installs a global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`, so any unknown property in a request body is a 400. Every DTO field therefore needs a `class-validator` decorator or it will be stripped/rejected. CORS is enabled wide-open.
- Update DTOs are `PartialType(CreateXDto)` from `@nestjs/mapped-types`.
- `AuthService.login` verifies an Argon2id hash, checks `active`, and signs a `JwtPayload` of `{ sub, user, roleId }`. **There is currently no guard, strategy, or `@UseGuards` anywhere** — the token is issued but never verified, and all other endpoints are unauthenticated. Adding route protection means building the guard from scratch (no `@nestjs/passport` dependency is installed; `JwtService` in `src/lib/jwt` already wraps sign/verify/decode).

## TypeScript / lint notes

- `tsconfig.json` uses `module: nodenext`, `strictNullChecks: true` but `noImplicitAny: false` and no full `strict`.
- ESLint runs `recommendedTypeChecked` plus Prettier-as-a-rule, so formatting violations are lint **errors**. Prettier config: single quotes, trailing commas everywhere.
- `baseUrl: "./"` allows `src/...`-prefixed imports (used once in `rol.module.ts`), but the prevailing style is relative paths.
