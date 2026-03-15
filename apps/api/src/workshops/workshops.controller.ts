import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CurrentUserContext } from '../auth/types';
import { BootstrapWorkshopDto } from './dto/bootstrap-workshop.dto';
import { WorkshopsService } from './workshops.service';

@Controller('workshops')
@UseGuards(AuthGuard, PermissionsGuard)
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post('bootstrap')
  @RequirePermissions('workshop.manage')
  async bootstrap(
    @CurrentUser() user: CurrentUserContext,
    @Body() body: BootstrapWorkshopDto,
  ) {
    return await this.workshopsService.bootstrapOwnerWorkshop(
      user,
      body.workshopName.trim(),
    );
  }
}