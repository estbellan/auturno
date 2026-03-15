import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { Workshop, WorkshopDocument } from './schemas/workshop.schema';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectModel(Workshop.name) private readonly workshopModel: Model<WorkshopDocument>,
  ) {}

  create(payload: CreateWorkshopDto) {
    return this.workshopModel.create(payload);
  }

  findById(id: string) {
    return this.workshopModel.findById(id).lean();
  }
}
