import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppointmentsService } from '../appointments/appointments.service';
import { ServicesService } from '../services/services.service';
import { WorkOrderEntity } from './work-order.entity';

@Injectable()
export class WorkOrdersService {
  private readonly workOrders: WorkOrderEntity[] = [];

  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly servicesService: ServicesService,
  ) {}

  createFromAppointment(workshopId: string, appointmentId: string): WorkOrderEntity {
    const appointment = this.appointmentsService.findByIdInWorkshop(
      workshopId,
      appointmentId,
    );
    const service = this.servicesService.findByIdInWorkshop(
      workshopId,
      appointment.serviceId,
    );

    const scheduled = new Date(appointment.scheduledStartAt);
    const deliveryDate = new Date(
      scheduled.getTime() + service.estimatedDurationHours * 60 * 60 * 1000,
    );

    const type = service.requiresDiagnostic ? 'diagnostic' : 'direct';
    const workOrder: WorkOrderEntity = {
      id: randomUUID(),
      workshopId,
      appointmentId: appointment.id,
      type,
      phase: type === 'diagnostic' ? 'reception' : 'scheduled',
      clientId: appointment.clientId,
      vehicleId: appointment.vehicleId,
      serviceId: appointment.serviceId,
      estimatedDiagnosticHours: type === 'diagnostic' ? service.estimatedDurationHours : 0,
      estimatedOperationHours: type === 'diagnostic' ? 0 : service.estimatedDurationHours,
      promisedDiagnosticAt: type === 'diagnostic' ? deliveryDate.toISOString() : null,
      promisedDeliveryAt: deliveryDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.workOrders.push(workOrder);
    return workOrder;
  }
}
