import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DiagnosticDocument = HydratedDocument<Diagnostic>;
export type DiagnosticStatus = 'draft' | 'completed';

@Schema({
  collection: 'diagnostics',
  timestamps: true,
})
export class Diagnostic {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, index: true })
  workOrderId!: string;

  @Prop({ required: true, enum: ['draft', 'completed'], default: 'draft' })
  status!: DiagnosticStatus;

  @Prop({ required: true, trim: true })
  summary!: string;

  @Prop({ required: false, trim: true, default: null, type: String })
  notes!: string | null;

  @Prop({ required: false, default: null, min: 0, type: Number })
  estimatedOperationHours!: number | null;

  @Prop({ required: true, type: [String], default: [] })
  recommendedServices!: string[];

  @Prop({ required: true, trim: true, index: true })
  createdByUserId!: string;

  @Prop({ required: false, default: null, type: Date })
  completedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const DiagnosticSchema = SchemaFactory.createForClass(Diagnostic);

DiagnosticSchema.index({ workshopId: 1, workOrderId: 1 }, { unique: true });
