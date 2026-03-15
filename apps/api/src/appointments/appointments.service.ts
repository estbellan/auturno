import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ServicesService } from '../services/services.service';
import { AppointmentEntity } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    private readonly servicesService: ServicesService,
  ) {}

  async create(
    workshopId: string,
    input: CreateAppointmentDto,
  ): Promise<AppointmentEntity> {
    const service = await this.servicesService.findByIdInWorkshop(
      workshopId,
      input.serviceId,
    );

    const created = await this.appointmentModel.create({
      workshopId,
      clientId: input.clientId,
      vehicleId: input.vehicleId,
      serviceId: input.serviceId,
      scheduledStartAt: new Date(input.scheduledStartAt),
      estimatedDurationHours: service.estimatedDurationHours,
    });

    return this.toEntity(created);
  }

  async findByIdInWorkshop(
    workshopId: string,
    appointmentId: string,
  ): Promise<AppointmentEntity> {
    const appointment = await this.appointmentModel
      .findOne({
        _id: appointmentId,
        workshopId,
      })
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found in workshop.');
    }

    return this.toEntity(appointment);
  }

  private toEntity(appointment: AppointmentDocument): AppointmentEntity {
    return {
      id: appointment._id.toString(),
      workshopId: appointment.workshopId,
      clientId: appointment.clientId,
      vehicleId: appointment.vehicleId,
      serviceId: appointment.serviceId,
      scheduledStartAt: appointment.scheduledStartAt.toISOString(),
      estimatedDurationHours: appointment.estimatedDurationHours,
      createdAt: appointment.createdAt.toISOString(),
    };
  }
}