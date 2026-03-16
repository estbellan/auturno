import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DiagnosticsModule } from '../diagnostics/diagnostics.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { Quote, QuoteSchema } from './schemas/quote.schema';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    DiagnosticsModule,
    WorkOrdersModule,
    MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }]),
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
