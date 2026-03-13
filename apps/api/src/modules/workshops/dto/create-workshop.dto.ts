import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkshopDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  @IsIn(['starter', 'pro'])
  plan?: 'starter' | 'pro';
}
