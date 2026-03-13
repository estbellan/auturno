import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DiagnosticDocument = HydratedDocument<Diagnostic>;

@Schema({ _id: false })
export class DiagnosticFinding {
  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: ['low', 'medium', 'high'] })
  severity!: 'low' | 'medium' | 'high';

  @Prop({ required: true })
  recommendation!: string;

  @Prop({ required: true, default: false })
  requiresImmediateRepair!: boolean;

  @Prop({ required: true, default: false })
  repaired!: boolean;

  @Prop()
  followUpSuggestedAt?: Date;
}

@Schema({ timestamps: true, collection: 'diagnostics' })
export class Diagnostic {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, index: true })
  workOrderId!: string;

  @Prop({ type: [DiagnosticFinding], default: [] })
  findings!: DiagnosticFinding[];
}

export const DiagnosticSchema = SchemaFactory.createForClass(Diagnostic);
DiagnosticSchema.index({ workshopId: 1, workOrderId: 1 }, { unique: true });
