import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const WorkshopId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: { workshopId?: string } }>();
    return request.user?.workshopId;
  },
);
