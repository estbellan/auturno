import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CurrentUserContext } from '../auth/types';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
@UseGuards(AuthGuard, PermissionsGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @RequirePermissions('clients.read')
  async list(
    @CurrentUser() user: CurrentUserContext,
    @Query('customerId') customerId?: string,
  ) {
    const workshopId = this.requireWorkshopId(user);
    return await this.vehiclesService.listInWorkshop(workshopId, customerId);
  }

  @Post()
  @RequirePermissions('clients.write')
  async create(
    @CurrentUser() user: CurrentUserContext,
    @Body() input: CreateVehicleDto,
  ) {
    const workshopId = this.requireWorkshopId(user);
    return await this.vehiclesService.create(workshopId, input);
  }

  @Patch(':id')
  @RequirePermissions('clients.write')
  async update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') vehicleId: string,
    @Body() input: UpdateVehicleDto,
  ) {
    const workshopId = this.requireWorkshopId(user);
    return await this.vehiclesService.update(workshopId, vehicleId, input);
  }

  private requireWorkshopId(user: CurrentUserContext): string {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return user.workshopId;
  }
}
