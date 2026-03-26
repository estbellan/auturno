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
import { ConvertServiceRequestDto } from './dto/convert-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { ServiceRequestsService } from './service-requests.service';

@Controller('service-requests')
@UseGuards(AuthGuard, PermissionsGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Get()
  @RequirePermissions('appointments.manage')
  async list(@CurrentUser() user: CurrentUserContext) {
    return await this.serviceRequestsService.listInWorkshop(
      this.requireWorkshopId(user),
    );
  }

  @Get(':id')
  @RequirePermissions('appointments.manage')
  async findOne(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') requestId: string,
  ) {
    return await this.serviceRequestsService.findByIdInWorkshop(
      this.requireWorkshopId(user),
      requestId,
    );
  }

  @Patch(':id/status')
  @RequirePermissions('appointments.manage')
  async updateStatus(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') requestId: string,
    @Body() input: UpdateServiceRequestStatusDto,
  ) {
    return await this.serviceRequestsService.updateStatusInWorkshop(
      this.requireWorkshopId(user),
      requestId,
      user.id,
      input,
    );
  }

  @Post(':id/convert-to-appointment')
  @RequirePermissions('appointments.manage')
  async convertToAppointment(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') requestId: string,
    @Body() input: ConvertServiceRequestDto,
  ) {
    return await this.serviceRequestsService.convertToAppointmentInWorkshop(
      this.requireWorkshopId(user),
      requestId,
      user.id,
      input,
    );
  }

  private requireWorkshopId(user: CurrentUserContext): string {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return user.workshopId;
  }
}
