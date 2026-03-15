import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditEventDocument = HydratedDocument<AuditEvent>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'audit_events' })
export class AuditEvent {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true })
  actorUserId!: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  entityType!: string;

  @Prop({ required: true })
  entityId!: string;

  @Prop({ type: Object, default: {} })
  payloadDiff!: Record<string, unknown>;
}

export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);
AuditEventSchema.index({ workshopId: 1, createdAt: -1 });
