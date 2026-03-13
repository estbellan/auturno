import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LoyaltyAccountDocument = HydratedDocument<LoyaltyAccount>;

@Schema({ _id: false })
export class LoyaltyTransaction {
  @Prop({ required: true })
  workOrderId!: string;

  @Prop({ required: true })
  points!: number;

  @Prop({ required: true })
  reason!: string;

  @Prop({ required: true })
  createdAt!: Date;
}

@Schema({ timestamps: true, collection: 'loyalty_accounts' })
export class LoyaltyAccount {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, index: true })
  clientId!: string;

  @Prop({ required: true, default: 0 })
  balance!: number;

  @Prop({ type: [LoyaltyTransaction], default: [] })
  transactions!: LoyaltyTransaction[];
}

export const LoyaltyAccountSchema = SchemaFactory.createForClass(LoyaltyAccount);
LoyaltyAccountSchema.index({ workshopId: 1, clientId: 1 }, { unique: true });
