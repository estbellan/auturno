import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const normalizedName = this.normalizeName(input.name);
    const existing = await this.serviceModel
      .findOne({
        workshopId,
        normalizedName,
      })
      .exec();

    if (existing) {
      throw new ConflictException('Service already exists in workshop.');
    }

    const created = await this.serviceModel.create({
      workshopId,
      name: input.name,
      normalizedName,
      estimatedDurationHours: input.estimatedDurationHours,
      requiresDiagnostic: input.requiresDiagnostic,
    });

    return this.toEntity(created);
  }

  async listInWorkshop(workshopId: string): Promise<ServiceEntity[]> {
    const services = await this.serviceModel
      .find({ workshopId })
      .sort({ name: 1, createdAt: -1 })
      .exec();

    return services.map((service) => this.toEntity(service));
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

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  }
}
