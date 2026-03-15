import { IsBoolean, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0.25)
  estimatedDurationHours!: number;

  @IsBoolean()
  requiresDiagnostic!: boolean;
}
