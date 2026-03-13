import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WorkOrderDocument = HydratedDocument<WorkOrder>;

const DIRECT_PHASES = ['scheduled', 'in_operation', 'ready', 'closed'] as const;
const DIAGNOSTIC_PHASES = [
  'reception',
  'in_diagnosis',
  'quote_sent',
  'awaiting_approval',
  'in_operation',
  'ready',
  'closed',
] as const;

@Schema({ _id: false })
export class PromiseChange {
  @Prop({ required: true })
  previousDate!: Date;

  @Prop({ required: true })
  nextDate!: Date;

  @Prop({ required: true })
  reason!: string;

  @Prop({ required: true })
  clientNotified!: boolean;

  @Prop({ required: true })
  changedAt!: Date;
}

@Schema({ timestamps: true, collection: 'work_orders' })
export class WorkOrder {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, enum: ['direct', 'diagnostic'] })
  type!: 'direct' | 'diagnostic';

  @Prop({ required: true, enum: [...DIRECT_PHASES, ...DIAGNOSTIC_PHASES] })
  phase!: (typeof DIRECT_PHASES)[number] | (typeof DIAGNOSTIC_PHASES)[number];

  @Prop({ required: true })
  clientId!: string;

  @Prop({ required: true })
  vehicleId!: string;

  @Prop({ type: [String], default: [] })
  serviceIds!: string[];

  @Prop({ min: 0, default: 0 })
  estimatedDiagnosticHours!: number;

  @Prop({ min: 0, default: 0 })
  estimatedOperationHours!: number;

  @Prop()
  promisedDiagnosticAt?: Date;

  @Prop()
  promisedDeliveryAt?: Date;

  @Prop()
  adjustedDeliveryDate?: Date;

  @Prop()
  deliveryChangeReason?: string;

  @Prop({ default: false })
  clientNotified!: boolean;

  @Prop()
  diagnosticStartAt?: Date;

  @Prop()
  diagnosticEndAt?: Date;

  @Prop()
  operationStartAt?: Date;

  @Prop()
  readyAt?: Date;

  @Prop()
  pickedUpAt?: Date;

  @Prop({ type: [PromiseChange], default: [] })
  promiseChanges!: PromiseChange[];
}

export const WorkOrderSchema = SchemaFactory.createForClass(WorkOrder);
WorkOrderSchema.index({ workshopId: 1, phase: 1 });
