import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AppointmentsService } from '../appointments/appointments.service';
import { CurrentUserContext } from '../auth/types';
import { CustomersService } from '../customers/customers.service';
import { ServicesService } from '../services/services.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ConvertServiceRequestDto } from './dto/convert-service-request.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import {
  ServiceRequest,
  ServiceRequestDocument,
} from './schemas/service-request.schema';
import { ServiceRequestEntity } from './service-request.entity';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectModel(ServiceRequest.name)
    private readonly serviceRequestModel: Model<ServiceRequestDocument>,
    private readonly appointmentsService: AppointmentsService,
    private readonly customersService: CustomersService,
    private readonly servicesService: ServicesService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async listClientRequests(
    workshopId: string,
    user: CurrentUserContext,
  ): Promise<ServiceRequestEntity[]> {
    const customer = await this.customersService.resolvePortalCustomerInWorkshop(
      workshopId,
      user,
    );

    if (!customer) {
      throw new NotFoundException('Client profile not found.');
    }

    const requests = await this.serviceRequestModel
      .find({
        workshopId,
        customerId: customer.id,
      })
      .sort({ createdAt: -1 })
      .exec();

    return requests.map((request) => this.toEntity(request));
  }

  async createClientRequest(
    workshopId: string,
    user: CurrentUserContext,
    input: CreateServiceRequestDto,
  ): Promise<ServiceRequestEntity> {
    const customer = await this.customersService.resolvePortalCustomerInWorkshop(
      workshopId,
      user,
    );

    if (!customer) {
      throw new NotFoundException('Client profile not found.');
    }

    const vehicle = await this.vehiclesService.findByIdInWorkshop(
      workshopId,
      input.vehicleId,
    );

    if (vehicle.customerId !== customer.id) {
      throw new NotFoundException('Vehicle not found for customer.');
    }

    await this.servicesService.findByIdInWorkshop(workshopId, input.serviceId);

    const preferredDateTime = this.normalizePreferredDateTime(input.preferredDateTime);
    const preferredDate = this.normalizePreferredDate(input.preferredDate);

    if (!preferredDateTime && !preferredDate) {
      throw new BadRequestException(
        'Provide preferredDateTime or preferredDate for the service request.',
      );
    }

    const created = await this.serviceRequestModel.create({
      workshopId,
      customerId: customer.id,
      vehicleId: input.vehicleId,
      serviceId: input.serviceId,
      preferredDateTime,
      preferredDate,
      comment: this.normalizeOptionalText(input.comment),
      status: 'pending',
      appointmentId: null,
      reviewedAt: null,
      reviewedByUserId: null,
    });

    return this.toEntity(created);
  }

  async listInWorkshop(workshopId: string): Promise<ServiceRequestEntity[]> {
    const requests = await this.serviceRequestModel
      .find({ workshopId })
      .sort({ createdAt: -1 })
      .exec();

    return requests.map((request) => this.toEntity(request));
  }

  async findByIdInWorkshop(
    workshopId: string,
    requestId: string,
  ): Promise<ServiceRequestEntity> {
    const request = await this.findDocumentByIdInWorkshop(workshopId, requestId);
    return this.toEntity(request);
  }

  async updateStatusInWorkshop(
    workshopId: string,
    requestId: string,
    actorUserId: string,
    input: UpdateServiceRequestStatusDto,
  ): Promise<ServiceRequestEntity> {
    const request = await this.findDocumentByIdInWorkshop(workshopId, requestId);

    if (request.status === 'converted') {
      throw new ConflictException(
        'Converted service requests cannot be updated anymore.',
      );
    }

    if (request.status === input.status) {
      return this.toEntity(request);
    }

    if (!this.canTransition(request.status, input.status)) {
      throw new ConflictException(
        `Service request cannot move from ${request.status} to ${input.status}.`,
      );
    }

    request.status = input.status;
    request.reviewedAt = new Date();
    request.reviewedByUserId = actorUserId;
    await request.save();

    return this.toEntity(request);
  }

  async convertToAppointmentInWorkshop(
    workshopId: string,
    requestId: string,
    actorUserId: string,
    input: ConvertServiceRequestDto,
  ): Promise<{ serviceRequest: ServiceRequestEntity; appointmentId: string }> {
    const request = await this.findDocumentByIdInWorkshop(workshopId, requestId);

    if (request.status !== 'accepted') {
      throw new ConflictException(
        'Only accepted service requests can be converted into appointments.',
      );
    }

    const scheduledStartAt =
      input.scheduledStartAt ??
      request.preferredDateTime?.toISOString() ??
      null;

    if (!scheduledStartAt) {
      throw new BadRequestException(
        'Provide scheduledStartAt to convert a date-only service request.',
      );
    }

    const appointment = await this.appointmentsService.create(workshopId, {
      clientId: request.customerId,
      vehicleId: request.vehicleId,
      serviceId: request.serviceId,
      scheduledStartAt,
    });

    request.status = 'converted';
    request.appointmentId = appointment.id;
    request.reviewedAt = new Date();
    request.reviewedByUserId = actorUserId;
    await request.save();

    return {
      serviceRequest: this.toEntity(request),
      appointmentId: appointment.id,
    };
  }

  private canTransition(
    currentStatus: ServiceRequestDocument['status'],
    nextStatus: UpdateServiceRequestStatusDto['status'],
  ): boolean {
    const allowedTransitions: Record<
      ServiceRequestDocument['status'],
      UpdateServiceRequestStatusDto['status'][]
    > = {
      pending: ['reviewed', 'accepted', 'rejected'],
      reviewed: ['accepted', 'rejected'],
      accepted: [],
      rejected: [],
      converted: [],
    };

    return allowedTransitions[currentStatus].includes(nextStatus);
  }

  private async findDocumentByIdInWorkshop(
    workshopId: string,
    requestId: string,
  ): Promise<ServiceRequestDocument> {
    const request = await this.serviceRequestModel
      .findOne({
        _id: requestId,
        workshopId,
      })
      .exec();

    if (!request) {
      throw new NotFoundException('Service request not found in workshop.');
    }

    return request;
  }

  private toEntity(request: ServiceRequestDocument): ServiceRequestEntity {
    return {
      id: request._id.toString(),
      workshopId: request.workshopId,
      customerId: request.customerId,
      vehicleId: request.vehicleId,
      serviceId: request.serviceId,
      preferredDateTime: request.preferredDateTime
        ? request.preferredDateTime.toISOString()
        : null,
      preferredDate: request.preferredDate,
      comment: request.comment,
      status: request.status,
      appointmentId: request.appointmentId,
      reviewedAt: request.reviewedAt ? request.reviewedAt.toISOString() : null,
      reviewedByUserId: request.reviewedByUserId,
      createdAt: request.createdAt.toISOString(),
    };
  }

  private normalizePreferredDateTime(value?: string): Date | null {
    if (!value?.trim()) {
      return null;
    }

    return new Date(value);
  }

  private normalizePreferredDate(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private normalizeOptionalText(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
