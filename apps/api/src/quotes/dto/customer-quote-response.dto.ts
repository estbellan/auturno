import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CustomerQuoteResponseDto {
  @IsString()
  @IsIn(['approve', 'reject'])
  decision!: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(300)
  comment?: string;
}
