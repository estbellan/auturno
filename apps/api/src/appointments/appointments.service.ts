import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CustomersService } from '../customers/customers.service';
import { ServicesService } from '../services/services.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { AppointmentEntity } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    private readonly customersService: CustomersService,
    private readonly servicesService: ServicesService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(
    workshopId: string,
    input: CreateAppointmentDto,
  ): Promise<AppointmentEntity> {
    await this.customersService.findByIdInWorkshop(workshopId, input.clientId);

    const vehicle = await this.vehiclesService.findByIdInWorkshop(
      workshopId,
      input.vehicleId,
    );

    if (vehicle.customerId !== input.clientId) {
      throw new NotFoundException(
        'Vehicle does not belong to the selected customer in workshop.',
      );
    }

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

  async listInWorkshop(workshopId: string): Promise<AppointmentEntity[]> {
    const appointments = await this.appointmentModel
      .find({ workshopId })
      .sort({ scheduledStartAt: 1, createdAt: 1 })
      .exec();

    return appointments.map((appointment) => this.toEntity(appointment));
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
