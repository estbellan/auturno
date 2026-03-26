import { IsDateString, IsOptional } from 'class-validator';

export class ConvertServiceRequestDto {
  @IsOptional()
  @IsDateString()
  scheduledStartAt?: string;
}
