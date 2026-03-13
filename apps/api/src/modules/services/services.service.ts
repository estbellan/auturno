import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceCatalog, ServiceCatalogDocument } from './schemas/service-catalog.schema';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(ServiceCatalog.name)
    private readonly serviceModel: Model<ServiceCatalogDocument>,
  ) {}

  create(workshopId: string, payload: CreateServiceDto) {
    return this.serviceModel.create({ ...payload, workshopId });
  }

  listByWorkshop(workshopId: string) {
    return this.serviceModel.find({ workshopId, isActive: true }).sort({ name: 1 }).lean();
  }
}
