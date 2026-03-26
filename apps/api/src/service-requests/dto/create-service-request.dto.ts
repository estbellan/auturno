import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateServiceRequestDto {
  @IsString()
  vehicleId!: string;

  @IsString()
  serviceId!: string;

  @IsOptional()
  @IsDateString()
  preferredDateTime?: string;

  @IsOptional()
  @IsString()
  preferredDate?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
