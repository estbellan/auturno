import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthClaims, CurrentUserContext, Role } from '../auth/types';
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
  private readonly users: UserEntity[] = [];

  findOrCreateFromAuthClaims(claims: AuthClaims): CurrentUserContext {
    let user = this.users.find((item) => item.authSubject === claims.sub);

    if (!user) {
      user = {
        id: randomUUID(),
        authSubject: claims.sub,
        email: claims.email ?? `${claims.sub}@auturno.local`,
        name: claims.name ?? 'New User',
        workshopId: null,
        roles: ['owner'],
        permissions: [...rolePermissionsMap.owner],
      };

      this.users.push(user);
    }

    return {
      id: user.id,
      authSubject: user.authSubject,
      email: user.email,
      name: user.name,
      workshopId: user.workshopId,
      roles: user.roles,
      permissions: user.permissions,
    };
  }

  attachUserToWorkshop(userId: string, workshopId: string, roles: Role[]): UserEntity {
    const user = this.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error('User not found.');
    }

    user.workshopId = workshopId;
    user.roles = roles;
    user.permissions = Array.from(
      new Set(roles.flatMap((role) => rolePermissionsMap[role] ?? [])),
    );

    return user;
  }
}
