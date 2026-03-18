import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CustomerEntity } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer, CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {}

  async listInWorkshop(workshopId: string): Promise<CustomerEntity[]> {
    const customers = await this.customerModel
      .find({ workshopId })
      .sort({ name: 1, createdAt: -1 })
      .exec();

    return customers.map((customer) => this.toEntity(customer));
  }

  async create(
    workshopId: string,
    input: CreateCustomerDto,
  ): Promise<CustomerEntity> {
    const created = await this.customerModel.create({
      workshopId,
      name: input.name.trim(),
      phone: this.normalizeOptionalText(input.phone),
      email: this.normalizeEmail(input.email),
    });

    return this.toEntity(created);
  }

  async findByIdInWorkshop(
    workshopId: string,
    customerId: string,
  ): Promise<CustomerEntity> {
    const customer = await this.customerModel
      .findOne({
        _id: customerId,
        workshopId,
      })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found in workshop.');
    }

    return this.toEntity(customer);
  }

  private toEntity(customer: CustomerDocument): CustomerEntity {
    return {
      id: customer._id.toString(),
      workshopId: customer.workshopId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      createdAt: customer.createdAt.toISOString(),
    };
  }

  private normalizeOptionalText(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private normalizeEmail(value?: string): string | null {
    const normalized = value?.trim().toLowerCase();
    return normalized ? normalized : null;
  }
}
