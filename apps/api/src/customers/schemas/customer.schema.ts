import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({
  collection: 'customers',
  timestamps: true,
})
export class Customer {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ type: String, trim: true, default: null })
  authSubject!: string | null;

  @Prop({
    required: true,
    enum: ['not_invited', 'invited', 'claimed'],
    default: 'not_invited',
  })
  inviteStatus!: 'not_invited' | 'invited' | 'claimed';

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: String, trim: true, default: null })
  phone!: string | null;

  @Prop({ type: String, trim: true, lowercase: true, default: null })
  email!: string | null;

  @Prop({ type: Date, default: null })
  invitedAt!: Date | null;

  @Prop({ type: Date, default: null })
  claimedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ workshopId: 1, name: 1, createdAt: -1 });
CustomerSchema.index(
  { workshopId: 1, authSubject: 1 },
  {
    unique: true,
    partialFilterExpression: {
      authSubject: { $type: 'string' },
    },
  },
);
CustomerSchema.index(
  { workshopId: 1, email: 1 },
  {
    partialFilterExpression: {
      email: { $type: 'string' },
    },
  },
);
