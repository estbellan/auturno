import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({
  collection: 'services',
  timestamps: true,
})
export class Service {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  normalizedName!: string;

  @Prop({ required: true, min: 0 })
  estimatedDurationHours!: number;

  @Prop({ required: true, default: false })
  requiresDiagnostic!: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

ServiceSchema.index({ workshopId: 1, normalizedName: 1 }, { unique: true });
