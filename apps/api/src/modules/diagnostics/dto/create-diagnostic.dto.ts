import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class FindingDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(['low', 'medium', 'high'])
  severity!: 'low' | 'medium' | 'high';

  @IsString()
  @IsNotEmpty()
  recommendation!: string;

  @IsBoolean()
  requiresImmediateRepair!: boolean;

  @IsBoolean()
  repaired!: boolean;

  @IsOptional()
  @IsDateString()
  followUpSuggestedAt?: string;
}

export class CreateDiagnosticDto {
  @IsString()
  @IsNotEmpty()
  workOrderId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FindingDto)
  findings!: FindingDto[];
}
