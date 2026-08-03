import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRecordatorioDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
