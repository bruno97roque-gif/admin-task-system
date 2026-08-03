import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRecordatorioDto } from './dto/create-recordatorio.dto';
import { UpdateRecordatorioDto } from './dto/update-recordatorio.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { Prisma, Recordatorio } from '../../lib/generated/prisma/client';

@Injectable()
export class RecordatorioService {
  constructor(private readonly prisma: PrismaService) {}

  create(createRecordatorioDto: CreateRecordatorioDto): Promise<Recordatorio> {
    return this.prisma.recordatorio.create({ data: createRecordatorioDto });
  }

  findAll(): Promise<Recordatorio[]> {
    return this.prisma.recordatorio.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number): Promise<Recordatorio> {
    const recordatorio = await this.prisma.recordatorio.findUnique({
      where: { id },
    });

    if (!recordatorio) {
      throw this.notFound(id);
    }

    return recordatorio;
  }

  async update(
    id: number,
    updateRecordatorioDto: UpdateRecordatorioDto,
  ): Promise<Recordatorio> {
    try {
      return await this.prisma.recordatorio.update({
        where: { id },
        data: updateRecordatorioDto,
      });
    } catch (error) {
      this.rethrow(error, id);
    }
  }

  async remove(id: number): Promise<Recordatorio> {
    try {
      return await this.prisma.recordatorio.delete({ where: { id } });
    } catch (error) {
      this.rethrow(error, id);
    }
  }

  private notFound(id: number): NotFoundException {
    return new NotFoundException(`Recordatorio con id ${id} no encontrado`);
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
