import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AuditService } from '../audit/audit.service';
import type { AuditEntityType, AuditEventAction } from '../audit/audit.entity';
import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';
import { DiagnosticEntity } from './diagnostic.entity';
import {
  Diagnostic,
  DiagnosticDocument,
} from './schemas/diagnostic.schema';
import { WorkOrdersService } from '../work-orders/work-orders.service';

@Injectable()
export class DiagnosticsService {
  constructor(
    @InjectModel(Diagnostic.name)
    private readonly diagnosticModel: Model<DiagnosticDocument>,
    private readonly auditService: AuditService,
    private readonly workOrdersService: WorkOrdersService,
  ) {}

  async createDraft(
    workshopId: string,
    workOrderId: string,
    createdByUserId: string,
    input: CreateDiagnosticDto,
  ): Promise<DiagnosticEntity> {
    const existing = await this.diagnosticModel
      .findOne({
        workshopId,
        workOrderId,
      })
      .exec();

    if (existing) {
      throw new ConflictException(
        'A diagnostic already exists for this work order.',
      );
    }

    const workOrder = await this.workOrdersService.findByIdInWorkshop(
      workshopId,
      workOrderId,
    );

    if (workOrder.type !== 'diagnostic') {
      throw new ConflictException(
        'Diagnostics are only allowed for diagnostic work orders.',
      );
    }

    if (workOrder.status === 'reception') {
      await this.workOrdersService.updateStatusInWorkshop(
        workshopId,
        workOrderId,
        'in_diagnosis',
        createdByUserId,
      );
    } else if (workOrder.status !== 'in_diagnosis') {
      throw new ConflictException(
        `Diagnostic draft cannot be created while work order is ${workOrder.status}.`,
      );
    }

    const created = await this.diagnosticModel.create({
      workshopId,
      workOrderId,
      status: 'draft',
      summary: input.summary,
      notes: input.notes ?? null,
      estimatedOperationHours: input.estimatedOperationHours ?? null,
      recommendedServices: input.recommendedServices,
      createdByUserId,
      completedAt: null,
    });

    await this.auditService.create({
      workshopId,
      entityType: 'diagnostic',
      entityId: created._id.toString(),
      action: 'diagnostic_created',
      actorUserId: createdByUserId,
      metadata: {
        workOrderId,
        status: created.status,
      },
    });

    return this.toEntity(created);
  }

  async completeDiagnostic(
    workshopId: string,
    diagnosticId: string,
    actorUserId: string,
  ): Promise<DiagnosticEntity> {
    const diagnostic = await this.diagnosticModel
      .findOne({
        _id: diagnosticId,
        workshopId,
      })
      .exec();

    if (!diagnostic) {
      throw new NotFoundException('Diagnostic not found in workshop.');
    }

    if (diagnostic.status === 'completed') {
      return this.toEntity(diagnostic);
    }

    const workOrder = await this.workOrdersService.findByIdInWorkshop(
      workshopId,
      diagnostic.workOrderId,
    );

    if (workOrder.type !== 'diagnostic') {
      throw new ConflictException(
        'Diagnostics are only allowed for diagnostic work orders.',
      );
    }

    if (workOrder.status !== 'in_diagnosis') {
      throw new ConflictException(
        `Diagnostic can only be completed while work order is in_diagnosis, received ${workOrder.status}.`,
      );
    }

    diagnostic.status = 'completed';
    diagnostic.completedAt = new Date();
    await diagnostic.save();

    await this.auditService.create({
      workshopId,
      entityType: 'diagnostic',
      entityId: diagnostic._id.toString(),
      action: 'diagnostic_completed',
      actorUserId,
      metadata: {
        workOrderId: diagnostic.workOrderId,
        completedAt: diagnostic.completedAt.toISOString(),
      },
    });

    return this.toEntity(diagnostic);
  }

  async findByWorkOrderId(
    workshopId: string,
    workOrderId: string,
  ): Promise<DiagnosticEntity> {
    const workOrder = await this.workOrdersService.findByIdInWorkshop(
      workshopId,
      workOrderId,
    );

    if (workOrder.type !== 'diagnostic') {
      throw new ConflictException(
        'Diagnostics are only allowed for diagnostic work orders.',
      );
    }

    const diagnostic = await this.diagnosticModel
      .findOne({
        workshopId,
        workOrderId,
      })
      .exec();

    if (!diagnostic) {
      throw new NotFoundException('Diagnostic not found for work order.');
    }

    return this.toEntity(diagnostic);
  }

  async findByIdInWorkshop(
    workshopId: string,
    diagnosticId: string,
  ): Promise<DiagnosticEntity> {
    const diagnostic = await this.diagnosticModel
      .findOne({
        _id: diagnosticId,
        workshopId,
      })
      .exec();

    if (!diagnostic) {
      throw new NotFoundException('Diagnostic not found in workshop.');
    }

    return this.toEntity(diagnostic);
  }

  private toEntity(diagnostic: DiagnosticDocument): DiagnosticEntity {
    return {
      id: diagnostic._id.toString(),
      workshopId: diagnostic.workshopId,
      workOrderId: diagnostic.workOrderId,
      status: diagnostic.status,
      summary: diagnostic.summary,
      notes: diagnostic.notes,
      estimatedOperationHours: diagnostic.estimatedOperationHours,
      recommendedServices: diagnostic.recommendedServices,
      createdByUserId: diagnostic.createdByUserId,
      completedAt: diagnostic.completedAt
        ? diagnostic.completedAt.toISOString()
        : null,
      createdAt: diagnostic.createdAt.toISOString(),
    };
  }
}
