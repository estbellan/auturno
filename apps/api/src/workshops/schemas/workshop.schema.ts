import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WorkshopDocument = HydratedDocument<Workshop>;

@Schema({
  collection: 'workshops',
  timestamps: true,
})
export class Workshop {
  @Prop({ required: true, trim: true })
  name!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const WorkshopSchema = SchemaFactory.createForClass(Workshop);