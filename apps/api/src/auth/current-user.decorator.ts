import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserContext } from './types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserContext => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUserContext }>();
    return request.user;
  },
);
