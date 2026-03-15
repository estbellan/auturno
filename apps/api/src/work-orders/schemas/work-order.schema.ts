import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WorkOrderDocument = HydratedDocument<WorkOrder>;
export type WorkOrderType = 'direct' | 'diagnostic';
export type WorkOrderPhase = 'scheduled' | 'reception';

@Schema({
  collection: 'work_orders',
  timestamps: true,
})
export class WorkOrder {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, index: true })
  appointmentId!: string;

  @Prop({ required: true, enum: ['direct', 'diagnostic'] })
  type!: WorkOrderType;

  @Prop({ required: true, enum: ['scheduled', 'reception'] })
  phase!: WorkOrderPhase;

  @Prop({ required: true, trim: true })
  clientId!: string;

  @Prop({ required: true, trim: true })
  vehicleId!: string;

  @Prop({ required: true, trim: true, index: true })
  serviceId!: string;

  @Prop({ required: true, min: 0, default: 0 })
  estimatedDiagnosticHours!: number;

  @Prop({ required: true, min: 0, default: 0 })
  estimatedOperationHours!: number;

  @Prop({ type: Date, default: null })
  promisedDiagnosticAt!: Date | null;

  @Prop({ type: Date, default: null })
  promisedDeliveryAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const WorkOrderSchema = SchemaFactory.createForClass(WorkOrder);

WorkOrderSchema.index({ workshopId: 1, appointmentId: 1 }, { unique: true });