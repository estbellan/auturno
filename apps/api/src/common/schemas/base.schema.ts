import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class TenantOwnedFields {
  @Prop({ required: true, index: true })
  workshopId!: string;
}
