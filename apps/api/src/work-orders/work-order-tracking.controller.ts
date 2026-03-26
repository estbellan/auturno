import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserContext } from '../auth/types';
import { WorkOrdersService } from './work-orders.service';

@Controller('work-orders')
@UseGuards(AuthGuard)
export class WorkOrderTrackingController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get(':id/tracking')
  async tracking(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') workOrderId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.findTrackingViewInWorkshop(
      user.workshopId,
      workOrderId,
      user,
    );
  }
}
