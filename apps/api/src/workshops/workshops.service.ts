import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CurrentUserContext } from '../auth/types';
import { UsersService } from '../users/users.service';
import { WorkshopEntity } from './workshop.entity';

@Injectable()
export class WorkshopsService {
  private readonly workshops: WorkshopEntity[] = [];

  constructor(private readonly usersService: UsersService) {}

  bootstrapOwnerWorkshop(user: CurrentUserContext, workshopName: string): WorkshopEntity {
    if (user.workshopId) {
      const existing = this.workshops.find((item) => item.id === user.workshopId);
      if (existing) {
        return existing;
      }
    }

    const workshop: WorkshopEntity = {
      id: randomUUID(),
      name: workshopName,
      createdAt: new Date().toISOString(),
    };

    this.workshops.push(workshop);
    this.usersService.attachUserToWorkshop(user.id, workshop.id, ['owner']);

    return workshop;
  }
}
