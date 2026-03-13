import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Diagnostic, DiagnosticSchema } from './schemas/diagnostic.schema';
import { DiagnosticsService } from './diagnostics.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Diagnostic.name, schema: DiagnosticSchema }])],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
