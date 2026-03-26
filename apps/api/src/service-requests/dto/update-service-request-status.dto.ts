import { IsIn } from 'class-validator';

export class UpdateServiceRequestStatusDto {
  @IsIn(['reviewed', 'accepted', 'rejected'])
  status!: 'reviewed' | 'accepted' | 'rejected';
}
