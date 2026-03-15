import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema({
  collection: 'appointments',
  timestamps: true,
})
export class Appointment {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, trim: true })
  clientId!: string;

  @Prop({ required: true, trim: true })
  vehicleId!: string;

  @Prop({ required: true, trim: true, index: true })
  serviceId!: string;

  @Prop({ required: true, type: Date, index: true })
  scheduledStartAt!: Date;

  @Prop({ required: true, min: 0 })
  estimatedDurationHours!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index({ workshopId: 1, scheduledStartAt: 1 });