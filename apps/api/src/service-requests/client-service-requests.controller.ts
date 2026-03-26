import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserContext } from '../auth/types';
import { ServicesService } from '../services/services.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestsService } from './service-requests.service';

@Controller('client')
@UseGuards(AuthGuard)
export class ClientServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly servicesService: ServicesService,
  ) {}

  @Get('services')
  async services(@CurrentUser() user: CurrentUserContext) {
    return await this.servicesService.listInWorkshop(
      this.requireClientWorkshopId(user),
    );
  }

  @Get('service-requests')
  async list(@CurrentUser() user: CurrentUserContext) {
    return await this.serviceRequestsService.listClientRequests(
      this.requireClientWorkshopId(user),
      user,
    );
  }

  @Post('service-requests')
  async create(
    @CurrentUser() user: CurrentUserContext,
    @Body() input: CreateServiceRequestDto,
  ) {
    return await this.serviceRequestsService.createClientRequest(
      this.requireClientWorkshopId(user),
      user,
      input,
    );
  }

  private requireClientWorkshopId(user: CurrentUserContext): string {
    if (!user.roles.includes('client')) {
      throw new ForbiddenException('Client portal is only available to customer accounts.');
    }

    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return user.workshopId;
  }
}
