import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CurrentUserContext } from '../auth/types';
import { UsersService } from '../users/users.service';
import { Workshop, WorkshopDocument } from './schemas/workshop.schema';
import { WorkshopEntity } from './workshop.entity';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectModel(Workshop.name)
    private readonly workshopModel: Model<WorkshopDocument>,
    private readonly usersService: UsersService,
  ) {}

  async bootstrapOwnerWorkshop(
    user: CurrentUserContext,
    workshopName: string,
  ): Promise<WorkshopEntity> {
    if (user.workshopId) {
      const existing = await this.workshopModel.findById(user.workshopId).exec();

      if (existing) {
        return this.toEntity(existing);
      }
    }

    const created = await this.workshopModel.create({
      name: workshopName,
    });

    await this.usersService.attachUserToWorkshop(
      user.id,
      created._id.toString(),
      ['owner'],
    );

    return this.toEntity(created);
  }

  private toEntity(workshop: WorkshopDocument): WorkshopEntity {
    return {
      id: workshop._id.toString(),
      name: workshop.name,
      createdAt: workshop.createdAt.toISOString(),
    };
  }
}