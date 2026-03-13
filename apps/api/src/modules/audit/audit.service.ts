import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateAuditEventDto } from './dto/create-audit-event.dto';
import { AuditEvent, AuditEventDocument } from './schemas/audit-event.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditEvent.name)
    private readonly auditEventModel: Model<AuditEventDocument>,
  ) {}

  record(workshopId: string, payload: CreateAuditEventDto) {
    return this.auditEventModel.create({ workshopId, ...payload });
  }
}
