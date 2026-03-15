import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../auth/types';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({ required: true, unique: true, index: true, trim: true })
  authSubject!: string;

  @Prop({ required: true, index: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: String, default: null, index: true })
  workshopId!: string | null;

  @Prop({ type: [String], required: true, default: ['owner'] })
  roles!: Role[];

  @Prop({ type: [String], required: true, default: [] })
  permissions!: string[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);