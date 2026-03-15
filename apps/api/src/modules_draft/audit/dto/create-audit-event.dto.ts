import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAuditEventDto {
  @IsString()
  @IsNotEmpty()
  actorUserId!: string;

  @IsString()
  @IsNotEmpty()
  action!: string;

  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @IsOptional()
  @IsObject()
  payloadDiff?: Record<string, unknown>;
}
