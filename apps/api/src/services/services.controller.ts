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
import { CreateServiceDto } from './dto/create-service.dto';
import { ServicesService } from './services.service';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
@UseGuards(AuthGuard, PermissionsGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @RequirePermissions('services.manage')
  async list(@CurrentUser() user: CurrentUserContext) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.servicesService.listInWorkshop(user.workshopId);
  }

  @Post()
  @RequirePermissions('services.manage')
  async create(
    @CurrentUser() user: CurrentUserContext,
    @Body() input: CreateServiceDto,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.servicesService.create(user.workshopId, input);
  }

  @Patch(':id')
  @RequirePermissions('services.manage')
  async update(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') serviceId: string,
    @Body() input: UpdateServiceDto,
  ) {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return await this.servicesService.update(user.workshopId, serviceId, input);
  }
}
