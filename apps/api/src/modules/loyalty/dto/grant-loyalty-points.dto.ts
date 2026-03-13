import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class GrantLoyaltyPointsDto {
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  workOrderId!: string;

  @IsNumber()
  @Min(1)
  points!: number;
}
