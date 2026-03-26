import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AuditService } from '../audit/audit.service';
import { CurrentUserContext } from '../auth/types';
import { CustomerEntity } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer, CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    private readonly auditService: AuditService,
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
      authSubject: null,
      inviteStatus: 'not_invited',
      name: input.name.trim(),
      phone: this.normalizeOptionalText(input.phone),
      email: this.normalizeEmail(input.email),
      invitedAt: null,
      claimedAt: null,
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

  async update(
    workshopId: string,
    customerId: string,
    input: UpdateCustomerDto,
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

    customer.name = input.name.trim();
    customer.phone = this.normalizeOptionalText(input.phone);
    customer.email = this.normalizeEmail(input.email);
    await customer.save();

    return this.toEntity(customer);
  }

  async findByEmailInWorkshop(
    workshopId: string,
    email: string,
  ): Promise<CustomerEntity | null> {
    const normalizedEmail = this.normalizeEmail(email);

    if (!normalizedEmail) {
      return null;
    }

    const customer = await this.customerModel
      .findOne({
        workshopId,
        email: normalizedEmail,
      })
      .exec();

    return customer ? this.toEntity(customer) : null;
  }

  async createInvite(
    workshopId: string,
    customerId: string,
    actorUserId: string,
  ): Promise<CustomerEntity> {
    const customer = await this.findDocumentByIdInWorkshop(workshopId, customerId);

    if (!customer.email) {
      throw new ConflictException(
        'Customer needs an email before client portal access can be invited.',
      );
    }

    if (customer.authSubject || customer.inviteStatus === 'claimed') {
      throw new ConflictException('Customer already claimed client portal access.');
    }

    customer.inviteStatus = 'invited';
    customer.invitedAt = new Date();
    await customer.save();

    await this.auditService.create({
      workshopId,
      entityType: 'customer',
      entityId: customer._id.toString(),
      action: 'customer_invited',
      actorUserId,
      metadata: {
        email: customer.email,
        invitedAt: customer.invitedAt.toISOString(),
      },
    });

    return this.toEntity(customer);
  }

  async getPortalAccessStateInWorkshop(
    workshopId: string,
    user: CurrentUserContext,
  ): Promise<{
    status: 'not_invited' | 'invited' | 'claimed';
    customer: CustomerEntity | null;
  }> {
    const linkedCustomer = await this.findDocumentByAuthSubject(
      workshopId,
      user.authSubject,
    );

    if (linkedCustomer) {
      return {
        status: 'claimed',
        customer: this.toEntity(linkedCustomer),
      };
    }

    const normalizedEmail = this.normalizeEmail(user.email);
    if (!normalizedEmail) {
      return { status: 'not_invited', customer: null };
    }

    const invitedCustomer = await this.customerModel
      .findOne({
        workshopId,
        email: normalizedEmail,
        authSubject: null,
        inviteStatus: 'invited',
      })
      .exec();

    if (invitedCustomer) {
      return {
        status: 'invited',
        customer: this.toEntity(invitedCustomer),
      };
    }

    const legacyCustomer = await this.customerModel
      .findOne({
        workshopId,
        email: normalizedEmail,
        authSubject: null,
        inviteStatus: 'not_invited',
      })
      .exec();

    if (!legacyCustomer) {
      return { status: 'not_invited', customer: null };
    }

    await this.claimDocument(legacyCustomer, user, true);

    return {
      status: 'claimed',
      customer: this.toEntity(legacyCustomer),
    };
  }

  async claimInvitedPortalCustomerInWorkshop(
    workshopId: string,
    user: CurrentUserContext,
  ): Promise<CustomerEntity> {
    const linkedCustomer = await this.findDocumentByAuthSubject(
      workshopId,
      user.authSubject,
    );

    if (linkedCustomer) {
      return this.toEntity(linkedCustomer);
    }

    const normalizedEmail = this.normalizeEmail(user.email);

    if (!normalizedEmail) {
      throw new NotFoundException('Client invite not found.');
    }

    const invitedCustomer = await this.customerModel
      .findOne({
        workshopId,
        email: normalizedEmail,
        authSubject: null,
        inviteStatus: 'invited',
      })
      .exec();

    if (!invitedCustomer) {
      throw new NotFoundException('Client invite not found.');
    }

    await this.claimDocument(invitedCustomer, user, false);
    return this.toEntity(invitedCustomer);
  }

  async resolvePortalCustomerInWorkshop(
    workshopId: string,
    user: CurrentUserContext,
  ): Promise<CustomerEntity | null> {
    const linkedBySubject = await this.findDocumentByAuthSubject(
      workshopId,
      user.authSubject,
    );

    if (linkedBySubject) {
      return this.toEntity(linkedBySubject);
    }

    const normalizedEmail = this.normalizeEmail(user.email);
    if (!normalizedEmail) {
      return null;
    }

    const legacyCustomer = await this.customerModel
      .findOne({
        workshopId,
        email: normalizedEmail,
        authSubject: null,
        inviteStatus: 'not_invited',
      })
      .exec();

    if (!legacyCustomer) {
      return null;
    }

    await this.claimDocument(legacyCustomer, user, true);

    return this.toEntity(legacyCustomer);
  }

  private async findDocumentByIdInWorkshop(
    workshopId: string,
    customerId: string,
  ): Promise<CustomerDocument> {
    const customer = await this.customerModel
      .findOne({
        _id: customerId,
        workshopId,
      })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found in workshop.');
    }

    return customer;
  }

  private async findDocumentByAuthSubject(
    workshopId: string,
    authSubject: string,
  ): Promise<CustomerDocument | null> {
    return await this.customerModel
      .findOne({
        workshopId,
        authSubject,
      })
      .exec();
  }

  private async claimDocument(
    customer: CustomerDocument,
    user: CurrentUserContext,
    isLegacyFallback: boolean,
  ): Promise<void> {
    customer.authSubject = user.authSubject;
    customer.inviteStatus = 'claimed';
    customer.claimedAt = new Date();
    await customer.save();

    await this.auditService.create({
      workshopId: customer.workshopId,
      entityType: 'customer',
      entityId: customer._id.toString(),
      action: 'customer_claimed',
      actorUserId: user.id,
      metadata: {
        email: customer.email,
        authSubject: user.authSubject,
        source: isLegacyFallback ? 'legacy_fallback' : 'invite_claim',
        claimedAt: customer.claimedAt.toISOString(),
      },
    });
  }

  private toEntity(customer: CustomerDocument): CustomerEntity {
    return {
      id: customer._id.toString(),
      workshopId: customer.workshopId,
      authSubject: customer.authSubject,
      inviteStatus: customer.inviteStatus,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      invitedAt: customer.invitedAt?.toISOString() ?? null,
      claimedAt: customer.claimedAt?.toISOString() ?? null,
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
