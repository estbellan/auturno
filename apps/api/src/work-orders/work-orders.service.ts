import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AuditService } from '../audit/audit.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ServicesService } from '../services/services.service';
import {
  WorkOrder,
  WorkOrderDocument,
  WorkOrderStatus,
} from './schemas/work-order.schema';
import { WorkOrderEntity } from './work-order.entity';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectModel(WorkOrder.name)
    private readonly workOrderModel: Model<WorkOrderDocument>,
    private readonly auditService: AuditService,
    private readonly appointmentsService: AppointmentsService,
    private readonly servicesService: ServicesService,
  ) {}

  async createFromAppointment(
    workshopId: string,
    appointmentId: string,
    actorUserId: string,
  ): Promise<WorkOrderEntity> {
    const existing = await this.workOrderModel
      .findOne({
        workshopId,
        appointmentId,
      })
      .exec();

    if (existing) {
      return this.toEntity(existing);
    }

    const appointment = await this.appointmentsService.findByIdInWorkshop(
      workshopId,
      appointmentId,
    );

    const service = await this.servicesService.findByIdInWorkshop(
      workshopId,
      appointment.serviceId,
    );

    const scheduled = new Date(appointment.scheduledStartAt);
    const firstPromiseDate = new Date(
      scheduled.getTime() + service.estimatedDurationHours * 60 * 60 * 1000,
    );

    const type = service.requiresDiagnostic ? 'diagnostic' : 'direct';

    const created = await this.workOrderModel.create({
      workshopId,
      appointmentId: appointment.id,
      type,
      status: type === 'diagnostic' ? 'reception' : 'scheduled',
      clientId: appointment.clientId,
      vehicleId: appointment.vehicleId,
      serviceId: appointment.serviceId,
      estimatedDiagnosticHours:
        type === 'diagnostic' ? service.estimatedDurationHours : 0,
      estimatedOperationHours:
        type === 'diagnostic' ? 0 : service.estimatedDurationHours,
      promisedDiagnosticAt:
        type === 'diagnostic' ? firstPromiseDate : null,
      promisedDeliveryAt:
        type === 'diagnostic' ? null : firstPromiseDate,
    });

    await this.auditService.create({
      workshopId,
      entityType: 'work_order',
      entityId: created._id.toString(),
      action: 'work_order_created',
      actorUserId,
      metadata: {
        appointmentId: appointment.id,
        type,
        status: created.status,
      },
    });

    return this.toEntity(created);
  }

  async findByIdInWorkshop(
    workshopId: string,
    workOrderId: string,
  ): Promise<WorkOrderEntity> {
    const workOrder = await this.workOrderModel
      .findOne({
        _id: workOrderId,
        workshopId,
      })
      .exec();

    if (!workOrder) {
      throw new NotFoundException('Work order not found in workshop.');
    }

    return this.toEntity(workOrder);
  }

  async updateStatusInWorkshop(
    workshopId: string,
    workOrderId: string,
    nextStatus: WorkOrderStatus,
    actorUserId: string,
  ): Promise<WorkOrderEntity> {
    const workOrder = await this.workOrderModel
      .findOne({
        _id: workOrderId,
        workshopId,
      })
      .exec();

    if (!workOrder) {
      throw new NotFoundException('Work order not found in workshop.');
    }

    if (!this.canTransition(workOrder.status, nextStatus)) {
      throw new ConflictException(
        `Work order cannot transition from ${workOrder.status} to ${nextStatus}.`,
      );
    }

    const previousStatus = workOrder.status;
    workOrder.status = nextStatus;
    await workOrder.save();

    await this.auditService.create({
      workshopId,
      entityType: 'work_order',
      entityId: workOrder._id.toString(),
      action: 'work_order_status_changed',
      actorUserId,
      metadata: {
        fromStatus: previousStatus,
        toStatus: nextStatus,
      },
    });

    return this.toEntity(workOrder);
  }

  private canTransition(
    currentStatus: WorkOrderStatus,
    nextStatus: WorkOrderStatus,
  ): boolean {
    if (currentStatus === nextStatus) {
      return true;
    }

    const allowedTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      scheduled: ['in_operation'],
      reception: ['in_diagnosis'],
      in_diagnosis: ['quote_sent'],
      quote_sent: ['awaiting_approval', 'in_operation', 'closed'],
      awaiting_approval: ['in_operation', 'closed'],
      in_operation: ['ready'],
      ready: ['closed'],
      closed: ['picked_up'],
      picked_up: [],
    };

    return allowedTransitions[currentStatus].includes(nextStatus);
  }

  private toEntity(workOrder: WorkOrderDocument): WorkOrderEntity {
    return {
      id: workOrder._id.toString(),
      workshopId: workOrder.workshopId,
      appointmentId: workOrder.appointmentId,
      type: workOrder.type,
      status: workOrder.status,
      phase: workOrder.status,
      clientId: workOrder.clientId,
      vehicleId: workOrder.vehicleId,
      serviceId: workOrder.serviceId,
      estimatedDiagnosticHours: workOrder.estimatedDiagnosticHours,
      estimatedOperationHours: workOrder.estimatedOperationHours,
      promisedDiagnosticAt: workOrder.promisedDiagnosticAt
        ? workOrder.promisedDiagnosticAt.toISOString()
        : null,
      promisedDeliveryAt: workOrder.promisedDeliveryAt
        ? workOrder.promisedDeliveryAt.toISOString()
        : null,
      createdAt: workOrder.createdAt.toISOString(),
    };
  }
}
