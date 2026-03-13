import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Placeholder guard for Auth0 token validation.
 * Replace with Passport/Auth0 strategy when auth integration is wired.
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: unknown }>();
    return Boolean(request.user);
  }
}
