import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({
  collection: 'vehicles',
  timestamps: true,
})
export class Vehicle {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, index: true, trim: true })
  customerId!: string;

  @Prop({ required: true, trim: true })
  plate!: string;

  @Prop({ required: true, trim: true, index: true })
  normalizedPlate!: string;

  @Prop({ type: String, trim: true, default: null })
  brand!: string | null;

  @Prop({ type: String, trim: true, default: null })
  model!: string | null;

  @Prop({ type: Number, default: null, min: 1900, max: 2100 })
  year!: number | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);

VehicleSchema.index({ workshopId: 1, normalizedPlate: 1 }, { unique: true });
VehicleSchema.index({ workshopId: 1, customerId: 1, createdAt: -1 });
