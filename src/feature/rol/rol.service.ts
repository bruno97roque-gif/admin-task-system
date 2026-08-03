import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { Prisma, Rol } from '../../lib/generated/prisma/client';

@Injectable()
export class RolService {
  constructor(private readonly prisma: PrismaService) {}

  create(createRolDto: CreateRolDto): Promise<Rol> {
    return this.prisma.rol.create({ data: createRolDto });
  }

  findAll(): Promise<Rol[]> {
    return this.prisma.rol.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number): Promise<Rol> {
    const rol = await this.prisma.rol.findUnique({ where: { id } });

    if (!rol) {
      throw this.notFound(id);
    }

    return rol;
  }

  async update(id: number, updateRolDto: UpdateRolDto): Promise<Rol> {
    try {
      return await this.prisma.rol.update({
        where: { id },
        data: updateRolDto,
      });
    } catch (error) {
      this.rethrow(error, id);
    }
  }

  async remove(id: number): Promise<Rol> {
    const usuarios = await this.prisma.user.count({ where: { roleId: id } });

    if (usuarios > 0) {
      throw new ConflictException(
        `El rol ${id} tiene ${usuarios} usuario(s) asignado(s) y no se puede eliminar`,
      );
    }

    try {
      return await this.prisma.rol.delete({ where: { id } });
    } catch (error) {
      this.rethrow(error, id);
    }
  }

  private notFound(id: number): NotFoundException {
    return new NotFoundException(`Rol con id ${id} no encontrado`);
  }

  private rethrow(error: unknown, id: number): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw this.notFound(id);
    }

    throw error;
  }
}
