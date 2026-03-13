import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';
import { Diagnostic, DiagnosticDocument } from './schemas/diagnostic.schema';

@Injectable()
export class DiagnosticsService {
  constructor(
    @InjectModel(Diagnostic.name) private readonly diagnosticModel: Model<DiagnosticDocument>,
  ) {}

  upsert(workshopId: string, payload: CreateDiagnosticDto) {
    return this.diagnosticModel.findOneAndUpdate(
      { workshopId, workOrderId: payload.workOrderId },
      { workshopId, workOrderId: payload.workOrderId, findings: payload.findings },
      { upsert: true, new: true },
    );
  }
}
