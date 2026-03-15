import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuoteDocument = HydratedDocument<Quote>;

@Schema({ _id: false })
export class QuoteItem {
  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ required: true, min: 0 })
  total!: number;
}

@Schema({ timestamps: true, collection: 'quotes' })
export class Quote {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, index: true })
  workOrderId!: string;

  @Prop({ type: [QuoteItem], default: [] })
  items!: QuoteItem[];

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({ required: true, enum: ['draft', 'sent', 'approved', 'rejected'], default: 'draft' })
  status!: 'draft' | 'sent' | 'approved' | 'rejected';
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
QuoteSchema.index({ workshopId: 1, workOrderId: 1 });
