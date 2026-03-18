import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CustomersService } from '../customers/customers.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehicleEntity } from './vehicle.entity';
import { Vehicle, VehicleDocument } from './schemas/vehicle.schema';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>,
    private readonly customersService: CustomersService,
  ) {}

  async listInWorkshop(
    workshopId: string,
    customerId?: string,
  ): Promise<VehicleEntity[]> {
    const filters: { workshopId: string; customerId?: string } = { workshopId };

    if (customerId) {
      await this.customersService.findByIdInWorkshop(workshopId, customerId);
      filters.customerId = customerId;
    }

    const vehicles = await this.vehicleModel
      .find(filters)
      .sort({ createdAt: -1, plate: 1 })
      .exec();

    return vehicles.map((vehicle) => this.toEntity(vehicle));
  }

  async create(
    workshopId: string,
    input: CreateVehicleDto,
  ): Promise<VehicleEntity> {
    await this.customersService.findByIdInWorkshop(workshopId, input.customerId);

    const normalizedPlate = this.normalizePlate(input.plate);
    const existing = await this.vehicleModel
      .findOne({
        workshopId,
        normalizedPlate,
      })
      .exec();

    if (existing) {
      throw new ConflictException('Vehicle already exists in workshop.');
    }

    const created = await this.vehicleModel.create({
      workshopId,
      customerId: input.customerId,
      plate: input.plate.trim().toUpperCase(),
      normalizedPlate,
      brand: this.normalizeOptionalText(input.brand),
      model: this.normalizeOptionalText(input.model),
      year: input.year ?? null,
    });

    return this.toEntity(created);
  }

  async findByIdInWorkshop(
    workshopId: string,
    vehicleId: string,
  ): Promise<VehicleEntity> {
    const vehicle = await this.vehicleModel
      .findOne({
        _id: vehicleId,
        workshopId,
      })
      .exec();

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found in workshop.');
    }

    return this.toEntity(vehicle);
  }

  private toEntity(vehicle: VehicleDocument): VehicleEntity {
    return {
      id: vehicle._id.toString(),
      workshopId: vehicle.workshopId,
      customerId: vehicle.customerId,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      createdAt: vehicle.createdAt.toISOString(),
    };
  }

  private normalizeOptionalText(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private normalizePlate(plate: string): string {
    return plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
}
