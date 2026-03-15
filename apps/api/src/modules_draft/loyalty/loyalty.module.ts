import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LoyaltyService } from './loyalty.service';
import { LoyaltyAccount, LoyaltyAccountSchema } from './schemas/loyalty-account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LoyaltyAccount.name, schema: LoyaltyAccountSchema }]),
  ],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
