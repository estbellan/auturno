import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AppointmentsService } from '../appointments/appointments.service';
import { ServicesService } from '../services/services.service';
import { WorkOrder, WorkOrderDocument } from './schemas/work-order.schema';
import { WorkOrderEntity } from './work-order.entity';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectModel(WorkOrder.name)
    private readonly workOrderModel: Model<WorkOrderDocument>,
    private readonly appointmentsService: AppointmentsService,
    private readonly servicesService: ServicesService,
  ) {}

  async createFromAppointment(
    workshopId: string,
    appointmentId: string,
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
      phase: type === 'diagnostic' ? 'reception' : 'scheduled',
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

    return this.toEntity(created);
  }

  private toEntity(workOrder: WorkOrderDocument): WorkOrderEntity {
    return {
      id: workOrder._id.toString(),
      workshopId: workOrder.workshopId,
      appointmentId: workOrder.appointmentId,
      type: workOrder.type,
      phase: workOrder.phase,
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