import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { PERMISSIONS, type Permission } from '../../../common/constants/permissions.constants';
import { ROLES, type Role } from '../../../common/constants/roles.constants';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, index: true })
  workshopId!: string;

  @Prop({ required: true, enum: ['auth0'] })
  authProvider!: 'auth0';

  @Prop({ required: true, index: true })
  authSubject!: string;

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: [String], enum: ROLES, default: ['operator'] })
  roles!: Role[];

  @Prop({ type: [String], enum: PERMISSIONS, default: [] })
  permissions!: Permission[];

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status!: 'active' | 'inactive';
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ workshopId: 1, email: 1 }, { unique: true });
UserSchema.index({ workshopId: 1, authSubject: 1 }, { unique: true });
