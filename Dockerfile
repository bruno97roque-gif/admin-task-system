# Imagen completa (no -slim) a proposito: argon2 es un modulo nativo y
# necesita gcc/make/python3 si no encuentra binario precompilado.
FROM node:22

WORKDIR /app

# pnpm se instala con npm, NO con corepack. El corepack de las imagenes de
# build de Railway es anterior a pnpm 10/11 y falla al cargarlo con
# ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING.
RUN npm install -g pnpm@11.16.0

# pnpm-workspace.yaml es necesario en este paso: contiene allowBuilds, que
# es lo que autoriza a argon2 y prisma a ejecutar sus scripts de compilacion.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# --prod=false fuerza instalar devDependencies aunque el entorno defina
# NODE_ENV=production: el build necesita @nestjs/cli y typescript.
RUN pnpm install --frozen-lockfile --prod=false

COPY . .

RUN pnpm build

# Railway deduce de EXPOSE a que puerto enrutar el trafico cuando el build
# es por Dockerfile. Sin esto responde 502 aunque la app este viva.
EXPOSE 3000

CMD ["node", "dist/main"]
