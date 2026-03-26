import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkOrderPromisesDto {
  @IsOptional()
  @IsISO8601()
  promisedDiagnosticAt?: string;

  @IsOptional()
  @IsISO8601()
  promisedDeliveryAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
