import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ServicesService } from '../services/services.service';
import { AppointmentEntity } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly appointments: AppointmentEntity[] = [];

  constructor(private readonly servicesService: ServicesService) {}

  create(workshopId: string, input: CreateAppointmentDto): AppointmentEntity {
    const service = this.servicesService.findByIdInWorkshop(workshopId, input.serviceId);

    const appointment: AppointmentEntity = {
      id: randomUUID(),
      workshopId,
      clientId: input.clientId,
      vehicleId: input.vehicleId,
      serviceId: input.serviceId,
      scheduledStartAt: input.scheduledStartAt,
      estimatedDurationHours: service.estimatedDurationHours,
      createdAt: new Date().toISOString(),
    };

    this.appointments.push(appointment);
    return appointment;
  }

  findByIdInWorkshop(workshopId: string, appointmentId: string): AppointmentEntity {
    const appointment = this.appointments.find(
      (item) => item.id === appointmentId && item.workshopId === workshopId,
    );

    if (!appointment) {
      throw new NotFoundException('Appointment not found in workshop.');
    }

    return appointment;
  }
}
