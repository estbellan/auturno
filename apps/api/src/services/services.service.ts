import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ServiceEntity } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  private readonly services: ServiceEntity[] = [];

  create(workshopId: string, input: CreateServiceDto): ServiceEntity {
    const created: ServiceEntity = {
      id: randomUUID(),
      workshopId,
      name: input.name,
      estimatedDurationHours: input.estimatedDurationHours,
      requiresDiagnostic: input.requiresDiagnostic,
    };

    this.services.push(created);
    return created;
  }

  findByIdInWorkshop(workshopId: string, serviceId: string): ServiceEntity {
    const service = this.services.find(
      (item) => item.workshopId === workshopId && item.id === serviceId,
    );

    if (!service) {
      throw new NotFoundException('Service not found in workshop.');
    }

    return service;
  }
}
