import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AuthClaims, CurrentUserContext, Role } from '../auth/types';
import { User, UserDocument } from './schemas/user.schema';
import { UserEntity } from './user.entity';

const rolePermissionsMap: Record<Role, string[]> = {
  owner: [
    'workshop.manage',
    'users.manage',
    'services.manage',
    'appointments.manage',
    'workorders.read',
    'workorders.write',
    'diagnostics.write',
    'quotes.write',
    'payments.write',
    'clients.read',
    'clients.write',
    'metrics.read',
  ],
  admin: [
    'services.manage',
    'appointments.manage',
    'workorders.read',
    'workorders.write',
    'diagnostics.write',
    'quotes.write',
    'clients.read',
    'clients.write',
  ],
  operator: [
    'appointments.manage',
    'workorders.read',
    'workorders.write',
    'quotes.write',
    'clients.read',
    'clients.write',
  ],
  mechanic: ['workorders.read', 'workorders.write', 'diagnostics.write'],
  client: [],
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findOrCreateFromAuthClaims(claims: AuthClaims): Promise<CurrentUserContext> {
    const authSubject = claims.sub;
    const email = (claims.email ?? `${claims.sub}@auturno.local`).trim().toLowerCase();
    const name = (claims.name ?? 'New User').trim();

    const user = await this.userModel
      .findOneAndUpdate(
        { authSubject },
        {
          $setOnInsert: {
            authSubject,
            email,
            name,
            workshopId: null,
            roles: ['owner'],
            permissions: [...rolePermissionsMap.owner],
          },
        },
        {
          new: true,
          upsert: true,
        },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User could not be created from auth claims.');
    }

    return this.toCurrentUserContext(user);
  }

  async attachUserToWorkshop(
    userId: string,
    workshopId: string,
    roles: Role[],
  ): Promise<UserEntity> {
    const permissions = this.resolvePermissions(roles);

    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          workshopId,
          roles,
          permissions,
        },
        {
          new: true,
        },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.toEntity(user);
  }

  private resolvePermissions(roles: Role[]): string[] {
    return Array.from(
      new Set(roles.flatMap((role) => rolePermissionsMap[role] ?? [])),
    );
  }

  private toCurrentUserContext(user: UserDocument): CurrentUserContext {
    return {
      id: user._id.toString(),
      authSubject: user.authSubject,
      email: user.email,
      name: user.name,
      workshopId: user.workshopId,
      roles: user.roles,
      permissions: user.permissions,
    };
  }

  private toEntity(user: UserDocument): UserEntity {
    return {
      id: user._id.toString(),
      authSubject: user.authSubject,
      email: user.email,
      name: user.name,
      workshopId: user.workshopId,
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}