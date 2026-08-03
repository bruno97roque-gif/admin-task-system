import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSeguimientoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
}
