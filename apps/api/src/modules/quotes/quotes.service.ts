import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateQuoteDto } from './dto/create-quote.dto';
import { Quote, QuoteDocument } from './schemas/quote.schema';

@Injectable()
export class QuotesService {
  constructor(@InjectModel(Quote.name) private readonly quoteModel: Model<QuoteDocument>) {}

  createDraft(workshopId: string, payload: CreateQuoteDto) {
    const items = payload.items.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));

    const total = items.reduce((sum, item) => sum + item.total, 0);

    return this.quoteModel.create({
      workshopId,
      workOrderId: payload.workOrderId,
      items,
      total,
      status: 'draft',
    });
  }
}
