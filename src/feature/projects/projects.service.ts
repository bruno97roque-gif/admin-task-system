import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { Prisma } from '../../lib/generated/prisma/client';

const proyectoInclude = {
  seguimiento: { select: { id: true, name: true } },
  usuarios: {
    select: {
      usuario: { select: { id: true, name: true, user: true, roleId: true } },
    },
  },
} satisfies Prisma.ProyectoInclude;

type ProyectoConRelaciones = Prisma.ProyectoGetPayload<{
  include: typeof proyectoInclude;
}>;

export type UsuarioAsignado =
  ProyectoConRelaciones['usuarios'][number]['usuario'];

export type ProyectoCompleto = Omit<ProyectoConRelaciones, 'usuarios'> & {
  usuarios: UsuarioAsignado[];
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto): Promise<ProyectoCompleto> {
    const { usuariosIds, fechaEntrega, ...data } = createProjectDto;

    await this.validarSeguimiento(data.seguimientoId);
    await this.validarUsuarios(usuariosIds);

    const proyecto = await this.prisma.proyecto.create({
      data: {
        ...data,
        fechaEntrega: this.aFecha(fechaEntrega),
        usuarios: {
          create: (usuariosIds ?? []).map((usuarioId) => ({ usuarioId })),
        },
      },
      include: proyectoInclude,
    });

    return this.aplanar(proyecto);
  }

  async findAll(): Promise<ProyectoCompleto[]> {
    const proyectos = await this.prisma.proyecto.findMany({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
      include: proyectoInclude,
    });

    return proyectos.map((proyecto) => this.aplanar(proyecto));
  }

  async findByProgramer(idProgramador?: number): Promise<ProyectoCompleto[]> {
    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        deletedAt: null,
        grupo: 'A',
        estadoProyecto: { not: 'ProyectoFinalizado' },
        ...(idProgramador !== undefined && {
          usuarios: { some: { usuarioId: idProgramador } },
        }),
      },
      orderBy: { id: 'asc' },
      include: proyectoInclude,
    });

    return proyectos.map((proyecto) => this.aplanar(proyecto));
  }

  /** Cola del admin: lo trabado por el cliente (B) y lo que no pagó (C). */
  async findByAdmin(): Promise<ProyectoCompleto[]> {
    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        deletedAt: null,
        grupo: { in: ['B', 'C'] },
      },
      orderBy: { id: 'asc' },
      include: proyectoInclude,
    });

    return proyectos.map((proyecto) => this.aplanar(proyecto));
  }

  async findByDiseno(): Promise<ProyectoCompleto[]> {
    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        deletedAt: null,
        grupo: 'A',
        estadoProyecto: 'Diseno',
      },
      orderBy: { id: 'asc' },
      include: proyectoInclude,
    });

    return proyectos.map((proyecto) => this.aplanar(proyecto));
  }

  async findOne(id: number): Promise<ProyectoCompleto> {
    const proyecto = await this.prisma.proyecto.findFirst({
      where: { id, deletedAt: null },
      include: proyectoInclude,
    });

    if (!proyecto) {
      throw this.notFound(id);
    }

    return this.aplanar(proyecto);
  }

  async update(
    id: number,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProyectoCompleto> {
    await this.findOne(id);

    const { usuariosIds, fechaEntrega, ...data } = updateProjectDto;

    if (data.seguimientoId !== undefined) {
      await this.validarSeguimiento(data.seguimientoId);
    }

    await this.validarUsuarios(usuariosIds);

    const proyecto = await this.prisma.proyecto.update({
      where: { id },
      data: {
        ...data,
        ...(fechaEntrega !== undefined && {
          fechaEntrega: this.aFecha(fechaEntrega),
        }),
        ...(usuariosIds !== undefined && {
          usuarios: {
            deleteMany: {},
            create: usuariosIds.map((usuarioId) => ({ usuarioId })),
          },
        }),
      },
      include: proyectoInclude,
    });

    return this.aplanar(proyecto);
  }

  async asignarUsuarios(
    id: number,
    usuariosIds: number[],
  ): Promise<ProyectoCompleto> {
    await this.findOne(id);
    await this.validarUsuarios(usuariosIds);

    await this.prisma.usuarioProyecto.createMany({
      data: usuariosIds.map((usuarioId) => ({ proyectoId: id, usuarioId })),
      skipDuplicates: true,
    });

    return this.findOne(id);
  }

  async quitarUsuario(
    id: number,
    usuarioId: number,
  ): Promise<ProyectoCompleto> {
    await this.findOne(id);

    const { count } = await this.prisma.usuarioProyecto.deleteMany({
      where: { proyectoId: id, usuarioId },
    });

    if (count === 0) {
      throw new NotFoundException(
        `El usuario ${usuarioId} no está asignado al proyecto ${id}`,
      );
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<ProyectoCompleto> {
    await this.findOne(id);

    const proyecto = await this.prisma.proyecto.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: proyectoInclude,
    });

    return this.aplanar(proyecto);
  }

  /** El ValidationPipe no transforma, así que la fecha llega como string ISO. */
  private aFecha(valor?: string | null): Date | null {
    return valor ? new Date(valor) : null;
  }

  private aplanar(proyecto: ProyectoConRelaciones): ProyectoCompleto {
    const { usuarios, ...resto } = proyecto;

    return { ...resto, usuarios: usuarios.map((fila) => fila.usuario) };
  }

  private async validarSeguimiento(seguimientoId: number): Promise<void> {
    const seguimiento = await this.prisma.seguimiento.findUnique({
      where: { id: seguimientoId },
      select: { id: true },
    });

    if (!seguimiento) {
      throw new BadRequestException(
        `El seguimiento con id ${seguimientoId} no existe`,
      );
    }
  }

  private async validarUsuarios(usuariosIds?: number[]): Promise<void> {
    if (usuariosIds === undefined || usuariosIds.length === 0) {
      return;
    }

    const existentes = await this.prisma.user.findMany({
      where: { id: { in: usuariosIds } },
      select: { id: true },
    });

    const faltantes = usuariosIds.filter(
      (usuarioId) => !existentes.some((usuario) => usuario.id === usuarioId),
    );

    if (faltantes.length > 0) {
      throw new BadRequestException(
        `Los usuarios con id ${faltantes.join(', ')} no existen`,
      );
    }
  }

  private notFound(id: number): NotFoundException {
    return new NotFoundException(`Proyecto con id ${id} no encontrado`);
  }
}
