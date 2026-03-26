import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceRequestDocument = HydratedDocument<ServiceRequest>;

@Schema({
  collection: 'service_requests',
  timestamps: true,
})
export class ServiceRequest {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, trim: true, index: true })
  customerId!: string;

  @Prop({ required: true, trim: true })
  vehicleId!: string;

  @Prop({ required: true, trim: true, index: true })
  serviceId!: string;

  @Prop({ type: Date, default: null })
  preferredDateTime!: Date | null;

  @Prop({ type: String, trim: true, default: null })
  preferredDate!: string | null;

  @Prop({ type: String, trim: true, default: null })
  comment!: string | null;

  @Prop({
    required: true,
    enum: ['pending', 'reviewed', 'accepted', 'rejected', 'converted'],
    default: 'pending',
    index: true,
  })
  status!: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'converted';

  @Prop({ type: String, trim: true, default: null })
  appointmentId!: string | null;

  @Prop({ type: Date, default: null })
  reviewedAt!: Date | null;

  @Prop({ type: String, trim: true, default: null })
  reviewedByUserId!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ServiceRequestSchema = SchemaFactory.createForClass(ServiceRequest);

ServiceRequestSchema.index({ workshopId: 1, createdAt: -1 });
ServiceRequestSchema.index({ workshopId: 1, customerId: 1, createdAt: -1 });
ServiceRequestSchema.index({ workshopId: 1, status: 1, createdAt: -1 });
