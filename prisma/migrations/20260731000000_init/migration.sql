-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('Brief', 'Taxonomia', 'Diseño', 'Desarrollo', 'Proyecto Finalizado');

-- CreateEnum
CREATE TYPE "Tecnologia" AS ENUM ('Shopify', 'WordPress', 'personalizado');

-- CreateEnum
CREATE TYPE "Grupo" AS ENUM ('A', 'B', 'C');

-- CreateTable
CREATE TABLE "rols" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "rols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimientos" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "seguimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "estado_pago" TEXT NOT NULL DEFAULT '50%',
    "estado_proyecto" "EstadoProyecto" NOT NULL DEFAULT 'Brief',
    "descripcion" TEXT NOT NULL,
    "tecnologia" "Tecnologia",
    "grupo" "Grupo" NOT NULL,
    "seguimiento_id" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "dias_sin_responder" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_proyectos" (
    "usuario_id" INTEGER NOT NULL,
    "proyecto_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_proyectos_pkey" PRIMARY KEY ("usuario_id","proyecto_id")
);

-- CreateTable
CREATE TABLE "recordatorios" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recordatorios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_key" ON "users"("user");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "proyectos_seguimiento_id_idx" ON "proyectos"("seguimiento_id");

-- CreateIndex
CREATE INDEX "usuarios_proyectos_usuario_id_idx" ON "usuarios_proyectos"("usuario_id");

-- CreateIndex
CREATE INDEX "usuarios_proyectos_proyecto_id_idx" ON "usuarios_proyectos"("proyecto_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "rols"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_seguimiento_id_fkey" FOREIGN KEY ("seguimiento_id") REFERENCES "seguimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_proyectos" ADD CONSTRAINT "usuarios_proyectos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_proyectos" ADD CONSTRAINT "usuarios_proyectos_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

