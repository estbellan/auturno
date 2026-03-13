import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkOrderDto {
  @IsEnum(['direct', 'diagnostic'])
  type!: 'direct' | 'diagnostic';

  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @IsArray()
  @IsString({ each: true })
  serviceIds!: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedDiagnosticHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedOperationHours?: number;
}
