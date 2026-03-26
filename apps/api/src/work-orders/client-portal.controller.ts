import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserContext } from '../auth/types';
import { CustomersService } from '../customers/customers.service';
import { UpdateCustomerDto } from '../customers/dto/update-customer.dto';
import { ClientCreateVehicleDto } from '../vehicles/dto/client-create-vehicle.dto';
import { UpdateVehicleDto } from '../vehicles/dto/update-vehicle.dto';
import { VehiclesService } from '../vehicles/vehicles.service';
import { WorkOrdersService } from './work-orders.service';

@Controller('client')
@UseGuards(AuthGuard)
export class ClientPortalController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly vehiclesService: VehiclesService,
    private readonly workOrdersService: WorkOrdersService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: CurrentUserContext) {
    const access = await this.requireClientPortalAccessState(user);
    return this.toClientPortalMe(access.status, access.customer);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: CurrentUserContext,
    @Body() input: UpdateCustomerDto,
  ) {
    const customer = await this.requirePortalCustomer(user);
    const updated = await this.customersService.update(
      customer.workshopId,
      customer.id,
      input,
    );

    return this.toClientProfile(updated);
  }

  @Post('claim')
  async claim(@CurrentUser() user: CurrentUserContext) {
    const workshopId = this.requireClientWorkshopId(user);
    const customer = await this.customersService.claimInvitedPortalCustomerInWorkshop(
      workshopId,
      user,
    );

    return this.toClientPortalMe('claimed', customer);
  }

  @Get('vehicles')
  async vehicles(@CurrentUser() user: CurrentUserContext) {
    const customer = await this.requirePortalCustomer(user);
    const vehicles = await this.vehiclesService.listForCustomerInWorkshop(
      customer.workshopId,
      customer.id,
    );

    return vehicles.map((vehicle) => this.toClientVehicle(vehicle));
  }

  @Post('vehicles')
  async createVehicle(
    @CurrentUser() user: CurrentUserContext,
    @Body() input: ClientCreateVehicleDto,
  ) {
    const customer = await this.requirePortalCustomer(user);
    const created = await this.vehiclesService.createForCustomerInWorkshop(
      customer.workshopId,
      customer.id,
      input,
    );

    return this.toClientVehicle(created);
  }

  @Patch('vehicles/:id')
  async updateVehicle(
    @CurrentUser() user: CurrentUserContext,
    @Param('id') vehicleId: string,
    @Body() input: UpdateVehicleDto,
  ) {
    const customer = await this.requirePortalCustomer(user);
    const updated = await this.vehiclesService.updateForCustomerInWorkshop(
      customer.workshopId,
      customer.id,
      vehicleId,
      input,
    );

    return this.toClientVehicle(updated);
  }

  @Get('work-orders')
  async workOrders(@CurrentUser() user: CurrentUserContext) {
    const customer = await this.requirePortalCustomer(user);
    return await this.workOrdersService.listClientVisibleInWorkshop(
      customer.workshopId,
      customer.id,
    );
  }

  private async requirePortalCustomer(user: CurrentUserContext) {
    const workshopId = this.requireClientWorkshopId(user);
    const customer = await this.customersService.resolvePortalCustomerInWorkshop(
      workshopId,
      user,
    );

    if (!customer) {
      throw new NotFoundException('Client profile not found.');
    }

    return customer;
  }

  private async requireClientPortalAccessState(user: CurrentUserContext) {
    const workshopId = this.requireClientWorkshopId(user);
    return await this.customersService.getPortalAccessStateInWorkshop(
      workshopId,
      user,
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

  private toClientProfile(customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  }) {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    };
  }

  private toClientPortalMe(
    status: 'not_invited' | 'invited' | 'claimed',
    customer: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      invitedAt?: string | null;
      claimedAt?: string | null;
    } | null,
  ) {
    return {
      status,
      canClaim: status === 'invited',
      customer: customer ? this.toClientProfile(customer) : null,
      invitedAt: customer?.invitedAt ?? null,
      claimedAt: customer?.claimedAt ?? null,
    };
  }

  private toClientVehicle(vehicle: {
    id: string;
    plate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    createdAt: string;
  }) {
    return {
      id: vehicle.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      createdAt: vehicle.createdAt,
    };
  }
}
