import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema({ timestamps: true, collection: 'appointments' })
export class Appointment {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true })
  clientId!: string;

  @Prop({ required: true })
  vehicleId!: string;

  @Prop({ required: true })
  serviceId!: string;

  @Prop({ required: true, min: 0.25 })
  estimatedDurationHours!: number;

  @Prop({ required: true })
  requiresDiagnostic!: boolean;

  @Prop({ required: true })
  scheduledStartAt!: Date;

  @Prop({ required: true })
  scheduledEndAt!: Date;

  @Prop({ required: true, enum: ['requested', 'confirmed', 'cancelled'], default: 'requested' })
  status!: 'requested' | 'confirmed' | 'cancelled';
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
AppointmentSchema.index({ workshopId: 1, scheduledStartAt: 1 });
