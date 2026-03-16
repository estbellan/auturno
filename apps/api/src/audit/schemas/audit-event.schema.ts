import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

import { AuditEntityType, AuditEventAction } from '../audit.entity';

export type AuditEventDocument = HydratedDocument<AuditEvent>;

@Schema({
  collection: 'audit_events',
  timestamps: true,
})
export class AuditEvent {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, enum: ['work_order', 'diagnostic', 'quote'] })
  entityType!: AuditEntityType;

  @Prop({ required: true, trim: true, index: true })
  entityId!: string;

  @Prop({
    required: true,
    enum: [
      'work_order_created',
      'work_order_status_changed',
      'diagnostic_created',
      'diagnostic_completed',
      'quote_created',
      'quote_sent',
      'quote_approved',
      'quote_rejected',
    ],
  })
  action!: AuditEventAction;

  @Prop({ required: true, trim: true, index: true })
  actorUserId!: string;

  @Prop({ required: false, default: null, type: SchemaTypes.Mixed })
  metadata!: Record<string, unknown> | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);

AuditEventSchema.index({ workshopId: 1, entityType: 1, entityId: 1, createdAt: -1 });
