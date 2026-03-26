import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UpdateServiceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  estimatedDurationHours!: number;

  @IsBoolean()
  requiresDiagnostic!: boolean;
}
