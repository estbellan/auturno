import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceCatalogDocument = HydratedDocument<ServiceCatalog>;

@Schema({ timestamps: true, collection: 'services' })
export class ServiceCatalog {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, min: 0.25 })
  estimatedDurationHours!: number;

  @Prop({ required: true, default: false })
  requiresDiagnostic!: boolean;

  @Prop({ default: true })
  isActive!: boolean;
}

export const ServiceCatalogSchema = SchemaFactory.createForClass(ServiceCatalog);
ServiceCatalogSchema.index({ workshopId: 1, name: 1 }, { unique: true });
