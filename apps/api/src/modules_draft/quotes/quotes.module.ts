import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Quote, QuoteSchema } from './schemas/quote.schema';
import { QuotesService } from './quotes.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }])],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
