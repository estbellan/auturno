import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateWorkOrderPhaseDto {
  @IsEnum([
    'scheduled',
    'reception',
    'in_diagnosis',
    'quote_sent',
    'awaiting_approval',
    'in_operation',
    'ready',
    'closed',
  ])
  phase!:
    | 'scheduled'
    | 'reception'
    | 'in_diagnosis'
    | 'quote_sent'
    | 'awaiting_approval'
    | 'in_operation'
    | 'ready'
    | 'closed';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  clientNotified?: boolean;
}
