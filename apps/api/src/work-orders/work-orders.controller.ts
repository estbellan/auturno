import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CurrentUserContext } from '../auth/types';
import { WorkOrdersService } from './work-orders.service';

@Controller('work-orders')
@UseGuards(AuthGuard, PermissionsGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get(':id')
  @RequirePermissions('workorders.read')
  async findById(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') workOrderId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.findByIdInWorkshop(
      user.workshopId,
      workOrderId,
    );
  }

  @Post('from-appointment/:appointmentId')
  @RequirePermissions('workorders.write')
  async createFromAppointment(
    @CurrentUser() user: CurrentUserContext,
    @Param('appointmentId') appointmentId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.createFromAppointment(
      user.workshopId,
      appointmentId,
      user.id,
    );
  }
}
