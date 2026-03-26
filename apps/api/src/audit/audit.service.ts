import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AuditEntity, AuditEntityType, AuditEventAction } from './audit.entity';
import {
  AuditEvent,
  AuditEventDocument,
} from './schemas/audit-event.schema';

interface CreateAuditEventInput {
  workshopId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditEventAction;
  actorUserId: string;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditEvent.name)
    private readonly auditEventModel: Model<AuditEventDocument>,
  ) {}

  async create(input: CreateAuditEventInput): Promise<AuditEntity> {
    const created = await this.auditEventModel.create({
      workshopId: input.workshopId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorUserId: input.actorUserId,
      metadata: input.metadata ?? null,
    });

    return this.toEntity(created);
  }

  async listWorkOrderHistory(
    workshopId: string,
    workOrderId: string,
  ): Promise<AuditEntity[]> {
    const events = await this.auditEventModel
      .find({
        workshopId,
        $or: [
          {
            entityType: 'work_order',
            entityId: workOrderId,
          },
          {
            'metadata.workOrderId': workOrderId,
          },
        ],
      })
      .sort({ createdAt: 1, _id: 1 })
      .exec();

    return events.map((event) => this.toEntity(event));
  }

  private toEntity(auditEvent: AuditEventDocument): AuditEntity {
    return {
      id: auditEvent._id.toString(),
      workshopId: auditEvent.workshopId,
      entityType: auditEvent.entityType,
      entityId: auditEvent.entityId,
      action: auditEvent.action,
      actorUserId: auditEvent.actorUserId,
      metadata: auditEvent.metadata,
      createdAt: auditEvent.createdAt.toISOString(),
    };
  }
}
