import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuoteDocument = HydratedDocument<Quote>;
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected';

@Schema({ _id: false })
export class QuoteItem {
  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ required: true, min: 0 })
  total!: number;
}

@Schema({
  collection: 'quotes',
  timestamps: true,
})
export class Quote {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, index: true })
  workOrderId!: string;

  @Prop({ required: true, index: true })
  diagnosticId!: string;

  @Prop({ required: true, enum: ['draft', 'sent', 'approved', 'rejected'], default: 'draft' })
  status!: QuoteStatus;

  @Prop({ required: true, type: [QuoteItem], default: [] })
  items!: QuoteItem[];

  @Prop({ required: true, min: 0 })
  subtotal!: number;

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({ required: false, default: null, type: Date })
  sentAt!: Date | null;

  @Prop({ required: false, default: null, type: Date })
  respondedAt!: Date | null;

  @Prop({ required: true, trim: true, index: true })
  createdByUserId!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);

QuoteSchema.index({ workshopId: 1, workOrderId: 1 }, { unique: true });
