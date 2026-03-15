import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { GrantLoyaltyPointsDto } from './dto/grant-loyalty-points.dto';
import { LoyaltyAccount, LoyaltyAccountDocument } from './schemas/loyalty-account.schema';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectModel(LoyaltyAccount.name)
    private readonly loyaltyModel: Model<LoyaltyAccountDocument>,
  ) {}

  async grantPoints(workshopId: string, payload: GrantLoyaltyPointsDto) {
    return this.loyaltyModel.findOneAndUpdate(
      { workshopId, clientId: payload.clientId },
      {
        $inc: { balance: payload.points },
        $push: {
          transactions: {
            workOrderId: payload.workOrderId,
            points: payload.points,
            reason: 'completed_order',
            createdAt: new Date(),
          },
        },
      },
      { upsert: true, new: true },
    );
  }
}
