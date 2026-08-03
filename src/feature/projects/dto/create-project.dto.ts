import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  EstadoProyecto,
  Grupo,
  Tecnologia,
} from '../../../lib/generated/prisma/client';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  estadoPago?: string;

  @IsOptional()
  @IsEnum(EstadoProyecto)
  estadoProyecto?: EstadoProyecto;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsOptional()
  @IsEnum(Tecnologia)
  tecnologia?: Tecnologia;

  @IsEnum(Grupo)
  grupo: Grupo;

  @IsInt()
  @IsPositive()
  seguimientoId: number;

  @IsString()
  @IsNotEmpty()
  comentario: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  diasSinResponder?: string;

  // Se acepta como string ISO-8601 ("2026-09-30" o con hora) porque el
  // ValidationPipe global no tiene transform: el servicio la convierte a Date.
  // null la deja sin fecha de entrega.
  @IsOptional()
  @IsISO8601()
  fechaEntrega?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  usuariosIds?: number[];
}
