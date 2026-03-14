import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from './permissions.decorator';
import { CurrentUserContext } from './types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: CurrentUserContext }>();
    const userPermissions = request.user?.permissions ?? [];

    const missingPermission = requiredPermissions.find(
      (permission) => !userPermissions.includes(permission),
    );

    if (missingPermission) {
      throw new ForbiddenException(`Missing permission: ${missingPermission}`);
    }

    return true;
  }
}
