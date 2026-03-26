import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ClientCreateVehicleDto {
  @IsString()
  plate!: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;
}
