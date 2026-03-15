import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateServiceDto } from './dto/create-service.dto';
import { Service, ServiceDocument } from './schemas/service.schema';
import { ServiceEntity } from './service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async create(workshopId: string, input: CreateServiceDto): Promise<ServiceEntity> {
    const created = await this.serviceModel.create({
      workshopId,
      name: input.name,
      estimatedDurationHours: input.estimatedDurationHours,
      requiresDiagnostic: input.requiresDiagnostic,
    });

    return this.toEntity(created);
  }

  async findByIdInWorkshop(workshopId: string, serviceId: string): Promise<ServiceEntity> {
    const service = await this.serviceModel.findOne({
      _id: serviceId,
      workshopId,
    });

    if (!service) {
      throw new NotFoundException('Service not found in workshop.');
    }

    return this.toEntity(service);
  }

  private toEntity(service: ServiceDocument): ServiceEntity {
    return {
      id: service._id.toString(),
      workshopId: service.workshopId,
      name: service.name,
      estimatedDurationHours: service.estimatedDurationHours,
      requiresDiagnostic: service.requiresDiagnostic,
    };
  }
}