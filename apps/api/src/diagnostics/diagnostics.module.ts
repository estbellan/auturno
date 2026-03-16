import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { Diagnostic, DiagnosticSchema } from './schemas/diagnostic.schema';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    WorkOrdersModule,
    MongooseModule.forFeature([
      { name: Diagnostic.name, schema: DiagnosticSchema },
    ]),
  ],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
