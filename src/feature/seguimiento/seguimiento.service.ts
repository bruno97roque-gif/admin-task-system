import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';
import { UpdateSeguimientoDto } from './dto/update-seguimiento.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { Prisma, Seguimiento } from '../../lib/generated/prisma/client';

@Injectable()
export class SeguimientoService {
  constructor(private readonly prisma: PrismaService) {}

  create(createSeguimientoDto: CreateSeguimientoDto): Promise<Seguimiento> {
    return this.prisma.seguimiento.create({ data: createSeguimientoDto });
  }

  findAll(): Promise<Seguimiento[]> {
    return this.prisma.seguimiento.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number): Promise<Seguimiento> {
    const seguimiento = await this.prisma.seguimiento.findUnique({
      where: { id },
    });

    if (!seguimiento) {
      throw this.notFound(id);
    }

    return seguimiento;
  }

  async update(
    id: number,
    updateSeguimientoDto: UpdateSeguimientoDto,
  ): Promise<Seguimiento> {
    try {
      return await this.prisma.seguimiento.update({
        where: { id },
        data: updateSeguimientoDto,
      });
    } catch (error) {
      this.rethrow(error, id);
    }
  }

  async remove(id: number): Promise<Seguimiento> {
    const proyectos = await this.prisma.proyecto.count({
      where: { seguimientoId: id },
    });

    if (proyectos > 0) {
      throw new ConflictException(
        `El seguimiento ${id} tiene ${proyectos} proyecto(s) asociado(s) y no se puede eliminar`,
      );
    }

    try {
      return await this.prisma.seguimiento.delete({ where: { id } });
    } catch (error) {
      this.rethrow(error, id);
    }
  }

  private notFound(id: number): NotFoundException {
    return new NotFoundException(`Seguimiento con id ${id} no encontrado`);
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
