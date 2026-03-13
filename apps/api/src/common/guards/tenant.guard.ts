import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Placeholder for workshop tenancy enforcement.
 * This guard should ensure the authenticated workshop context matches requested resources.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { workshopId?: string } }>();
    return Boolean(request.user?.workshopId);
  }
}
