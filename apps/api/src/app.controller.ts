import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth/auth.guard';
import { CurrentUser } from './auth/current-user.decorator';
import { CurrentUserContext } from './auth/types';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: CurrentUserContext) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      workshopId: user.workshopId,
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}
