import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WorkshopDocument = HydratedDocument<Workshop>;

@Schema({ timestamps: true, collection: 'workshops' })
export class Workshop {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, enum: ['starter', 'pro'], default: 'starter' })
  plan!: 'starter' | 'pro';

  @Prop({
    type: {
      timezone: { type: String, default: 'UTC' },
      currency: { type: String, default: 'USD' },
      pointsPerCompletedOrder: { type: Number, default: 10 },
    },
    default: {},
  })
  settings!: {
    timezone: string;
    currency: string;
    pointsPerCompletedOrder: number;
  };
}

export const WorkshopSchema = SchemaFactory.createForClass(Workshop);
