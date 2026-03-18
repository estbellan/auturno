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
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CurrentUserContext } from '../auth/types';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
@UseGuards(AuthGuard, PermissionsGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions('clients.read')
  async list(@CurrentUser() user: CurrentUserContext) {
    const workshopId = this.requireWorkshopId(user);
    return await this.customersService.listInWorkshop(workshopId);
  }

  @Post()
  @RequirePermissions('clients.write')
  async create(
    @CurrentUser() user: CurrentUserContext,
    @Body() input: CreateCustomerDto,
  ) {
    const workshopId = this.requireWorkshopId(user);
    return await this.customersService.create(workshopId, input);
  }

  private requireWorkshopId(user: CurrentUserContext): string {
    if (!user.workshopId) {
      throw new ForbiddenException('User is not attached to a workshop yet.');
    }

    return user.workshopId;
  }
}
