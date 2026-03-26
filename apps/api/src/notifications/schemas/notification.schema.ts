import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import {
  NotificationEventType,
  NotificationStatus,
} from '../notification.entity';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  collection: 'notifications',
  timestamps: true,
})
export class Notification {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, index: true })
  workOrderId!: string;

  @Prop({
    required: true,
    enum: [
      'quote_sent',
      'work_order_promises_changed',
      'work_order_status_changed',
    ] satisfies NotificationEventType[],
  })
  eventType!: NotificationEventType;

  @Prop({ required: true, trim: true })
  messagePreview!: string;

  @Prop({
    required: true,
    enum: ['pending', 'acknowledged'] satisfies NotificationStatus[],
    default: 'pending',
  })
  status!: NotificationStatus;

  @Prop({ type: Date, default: null })
  acknowledgedAt!: Date | null;

  @Prop({ type: String, default: null, trim: true })
  acknowledgedByUserId!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ workshopId: 1, workOrderId: 1, createdAt: -1 });
