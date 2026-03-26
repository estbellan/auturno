import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CurrentUserContext } from '../auth/types';
import { UpdateWorkOrderPromisesDto } from './dto/update-work-order-promises.dto';
import { WorkOrdersService } from './work-orders.service';

@Controller('work-orders')
@UseGuards(AuthGuard, PermissionsGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  @RequirePermissions('workorders.read')
  async list(@CurrentUser() user: CurrentUserContext) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.listInWorkshop(user.workshopId);
  }

  @Patch(':id/start-operation')
  @RequirePermissions('workorders.write')
  async startOperation(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') workOrderId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.updateStatusInWorkshop(
      user.workshopId,
      workOrderId,
      'in_operation',
      user.id,
    );
  }

  @Patch(':id/mark-ready')
  @RequirePermissions('workorders.write')
  async markReady(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') workOrderId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.updateStatusInWorkshop(
      user.workshopId,
      workOrderId,
      'ready',
      user.id,
    );
  }

  @Patch(':id/close')
  @RequirePermissions('workorders.write')
  async close(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') workOrderId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.updateStatusInWorkshop(
      user.workshopId,
      workOrderId,
      'closed',
      user.id,
    );
  }

  @Patch(':id/pick-up')
  @RequirePermissions('workorders.write')
  async pickUp(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') workOrderId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.updateStatusInWorkshop(
      user.workshopId,
      workOrderId,
      'picked_up',
      user.id,
    );
  }

  @Patch(':id/promises')
  @RequirePermissions('workorders.write')
  async updatePromises(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') workOrderId: string,
    @Body() input: UpdateWorkOrderPromisesDto,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.updatePromisesInWorkshop(
      user.workshopId,
      workOrderId,
      input,
      user.id,
    );
  }

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

  @Get(':id/history')
  @RequirePermissions('workorders.read')
  async history(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') workOrderId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.listHistoryInWorkshop(
      user.workshopId,
      workOrderId,
    );
  }

  @Get(':id/notifications')
  @RequirePermissions('workorders.read')
  async notifications(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') workOrderId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.listNotificationsInWorkshop(
      user.workshopId,
      workOrderId,
    );
  }

  @Patch(':id/notifications/:notificationId/acknowledge')
  @RequirePermissions('workorders.write')
  async acknowledgeNotification(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') workOrderId: string,
    @Param('notificationId') notificationId: string,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.workOrdersService.acknowledgeNotificationInWorkshop(
      user.workshopId,
      workOrderId,
      notificationId,
      user.id,
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
