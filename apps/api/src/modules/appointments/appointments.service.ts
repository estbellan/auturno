import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
  ) {}

  /**
   * Capacity validation should run before persisting appointment.
   */
  create(workshopId: string, payload: CreateAppointmentDto, durationHours: number, requiresDiagnostic: boolean) {
    const start = new Date(payload.scheduledStartAt);
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    return this.appointmentModel.create({
      workshopId,
      clientId: payload.clientId,
      vehicleId: payload.vehicleId,
      serviceId: payload.serviceId,
      estimatedDurationHours: durationHours,
      requiresDiagnostic,
      scheduledStartAt: start,
      scheduledEndAt: end,
      status: 'requested',
    });
  }
}
