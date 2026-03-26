import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AuditService } from '../audit/audit.service';
import { AuditEntity } from '../audit/audit.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { CurrentUserContext } from '../auth/types';
import { CustomersService } from '../customers/customers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Quote, QuoteDocument } from '../quotes/schemas/quote.schema';
import { ServicesService } from '../services/services.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ClientWorkOrderListItemEntity } from './client-work-order-list-item.entity';
import { UpdateWorkOrderPromisesDto } from './dto/update-work-order-promises.dto';
import {
  WorkOrder,
  WorkOrderDocument,
  WorkOrderStatus,
} from './schemas/work-order.schema';
import { WorkOrderEntity } from './work-order.entity';
import { WorkOrderTrackingEntity } from './work-order-tracking.entity';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectModel(WorkOrder.name)
    private readonly workOrderModel: Model<WorkOrderDocument>,
    @InjectModel(Quote.name)
    private readonly quoteModel: Model<QuoteDocument>,
    private readonly auditService: AuditService,
    private readonly appointmentsService: AppointmentsService,
    private readonly customersService: CustomersService,
    private readonly notificationsService: NotificationsService,
    private readonly servicesService: ServicesService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async createFromAppointment(
    workshopId: string,
    appointmentId: string,
    actorUserId: string,
  ): Promise<WorkOrderEntity> {
    const existing = await this.workOrderModel
      .findOne({
        workshopId,
        appointmentId,
      })
      .exec();

    if (existing) {
      return this.toEntity(existing);
    }

    const appointment = await this.appointmentsService.findByIdInWorkshop(
      workshopId,
      appointmentId,
    );

    const service = await this.servicesService.findByIdInWorkshop(
      workshopId,
      appointment.serviceId,
    );

    const scheduled = new Date(appointment.scheduledStartAt);
    const firstPromiseDate = new Date(
      scheduled.getTime() + service.estimatedDurationHours * 60 * 60 * 1000,
    );

    const type = service.requiresDiagnostic ? 'diagnostic' : 'direct';

    const created = await this.workOrderModel.create({
      workshopId,
      appointmentId: appointment.id,
      type,
      status: type === 'diagnostic' ? 'reception' : 'scheduled',
      clientId: appointment.clientId,
      vehicleId: appointment.vehicleId,
      serviceId: appointment.serviceId,
      estimatedDiagnosticHours:
        type === 'diagnostic' ? service.estimatedDurationHours : 0,
      estimatedOperationHours:
        type === 'diagnostic' ? 0 : service.estimatedDurationHours,
      promisedDiagnosticAt:
        type === 'diagnostic' ? firstPromiseDate : null,
      promisedDeliveryAt:
        type === 'diagnostic' ? null : firstPromiseDate,
    });

    await this.auditService.create({
      workshopId,
      entityType: 'work_order',
      entityId: created._id.toString(),
      action: 'work_order_created',
      actorUserId,
      metadata: {
        appointmentId: appointment.id,
        type,
        status: created.status,
      },
    });

    return this.toEntity(created);
  }

  async findByIdInWorkshop(
    workshopId: string,
    workOrderId: string,
  ): Promise<WorkOrderEntity> {
    const workOrder = await this.workOrderModel
      .findOne({
        _id: workOrderId,
        workshopId,
      })
      .exec();

    if (!workOrder) {
      throw new NotFoundException('Work order not found in workshop.');
    }

    return this.toEntity(workOrder);
  }

  async listInWorkshop(workshopId: string): Promise<WorkOrderEntity[]> {
    const workOrders = await this.workOrderModel
      .find({ workshopId })
      .sort({ createdAt: -1 })
      .exec();

    return workOrders.map((workOrder) => this.toEntity(workOrder));
  }

  async listHistoryInWorkshop(
    workshopId: string,
    workOrderId: string,
  ): Promise<AuditEntity[]> {
    await this.findByIdInWorkshop(workshopId, workOrderId);
    return await this.auditService.listWorkOrderHistory(workshopId, workOrderId);
  }

  async listNotificationsInWorkshop(
    workshopId: string,
    workOrderId: string,
  ) {
    await this.findByIdInWorkshop(workshopId, workOrderId);
    return await this.notificationsService.listByWorkOrder(workshopId, workOrderId);
  }

  async acknowledgeNotificationInWorkshop(
    workshopId: string,
    workOrderId: string,
    notificationId: string,
    actorUserId: string,
  ) {
    await this.findByIdInWorkshop(workshopId, workOrderId);
    return await this.notificationsService.acknowledge(
      workshopId,
      workOrderId,
      notificationId,
      actorUserId,
    );
  }

  async findTrackingViewInWorkshop(
    workshopId: string,
    workOrderId: string,
    user: CurrentUserContext,
  ): Promise<WorkOrderTrackingEntity> {
    const workOrder = await this.findDocumentByIdInWorkshop(workshopId, workOrderId);

    await this.assertTrackingAccess(workshopId, workOrder.clientId, user);

    const [vehicle, service, quote] = await Promise.all([
      this.vehiclesService.findByIdInWorkshop(workshopId, workOrder.vehicleId),
      this.servicesService.findByIdInWorkshop(workshopId, workOrder.serviceId),
      this.quoteModel
        .findOne({
          workshopId,
          workOrderId,
        })
        .exec(),
    ]);

    return {
      workOrderId: workOrder._id.toString(),
      quoteId: quote?._id.toString() ?? null,
      type: workOrder.type,
      currentStatus: workOrder.status,
      customerFacingStatusLabel: this.toCustomerFacingStatusLabel(workOrder.status),
      vehicleLabel: this.toVehicleLabel(vehicle),
      serviceName: service.name,
      promisedDiagnosticAt: workOrder.promisedDiagnosticAt
        ? workOrder.promisedDiagnosticAt.toISOString()
        : null,
      promisedDeliveryAt: workOrder.promisedDeliveryAt
        ? workOrder.promisedDeliveryAt.toISOString()
        : null,
      quoteStatus: quote?.status ?? null,
      lastUpdatedAt: workOrder.updatedAt.toISOString(),
    };
  }

  async listClientVisibleInWorkshop(
    workshopId: string,
    customerId: string,
  ): Promise<ClientWorkOrderListItemEntity[]> {
    const workOrders = await this.workOrderModel
      .find({
        workshopId,
        clientId: customerId,
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .exec();

    if (!workOrders.length) {
      return [];
    }

    const vehicleIds = Array.from(
      new Set(workOrders.map((workOrder) => workOrder.vehicleId)),
    );
    const serviceIds = Array.from(
      new Set(workOrders.map((workOrder) => workOrder.serviceId)),
    );
    const workOrderIds = workOrders.map((workOrder) => workOrder._id.toString());

    const [vehicles, services, quotes] = await Promise.all([
      Promise.all(
        vehicleIds.map((vehicleId) =>
          this.vehiclesService.findByIdInWorkshop(workshopId, vehicleId),
        ),
      ),
      Promise.all(
        serviceIds.map((serviceId) =>
          this.servicesService.findByIdInWorkshop(workshopId, serviceId),
        ),
      ),
      this.quoteModel
        .find({
          workshopId,
          workOrderId: { $in: workOrderIds },
        })
        .exec(),
    ]);

    const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
    const serviceMap = new Map(services.map((service) => [service.id, service]));
    const quoteMap = new Map(
      quotes.map((quote) => [quote.workOrderId, quote.status]),
    );

    return workOrders.map((workOrder) => ({
      workOrderId: workOrder._id.toString(),
      type: workOrder.type,
      currentStatus: workOrder.status,
      customerFacingStatusLabel: this.toCustomerFacingStatusLabel(workOrder.status),
      vehicleLabel: this.toVehicleLabel(
        vehicleMap.get(workOrder.vehicleId) ?? {
          plate: 'Vehicle unavailable',
          brand: null,
          model: null,
          year: null,
        },
      ),
      serviceName:
        serviceMap.get(workOrder.serviceId)?.name ?? 'Service unavailable',
      promisedDiagnosticAt: workOrder.promisedDiagnosticAt
        ? workOrder.promisedDiagnosticAt.toISOString()
        : null,
      promisedDeliveryAt: workOrder.promisedDeliveryAt
        ? workOrder.promisedDeliveryAt.toISOString()
        : null,
      quoteStatus: quoteMap.get(workOrder._id.toString()) ?? null,
      lastUpdatedAt: workOrder.updatedAt.toISOString(),
    }));
  }

  async updateStatusInWorkshop(
    workshopId: string,
    workOrderId: string,
    nextStatus: WorkOrderStatus,
    actorUserId: string,
    metadata?: Record<string, unknown>,
  ): Promise<WorkOrderEntity> {
    const workOrder = await this.workOrderModel
      .findOne({
        _id: workOrderId,
        workshopId,
      })
      .exec();

    if (!workOrder) {
      throw new NotFoundException('Work order not found in workshop.');
    }

    if (!this.canTransition(workOrder.status, nextStatus)) {
      throw new ConflictException(
        `Work order cannot transition from ${workOrder.status} to ${nextStatus}.`,
      );
    }

    const previousStatus = workOrder.status;
    workOrder.status = nextStatus;
    await workOrder.save();

    await this.auditService.create({
      workshopId,
      entityType: 'work_order',
      entityId: workOrder._id.toString(),
      action: 'work_order_status_changed',
      actorUserId,
      metadata: {
        fromStatus: previousStatus,
        toStatus: nextStatus,
        ...(metadata ?? {}),
      },
    });

    await this.notificationsService.registerStatusChange(
      workshopId,
      workOrder._id.toString(),
      nextStatus,
    );

    return this.toEntity(workOrder);
  }

  async updatePromisesInWorkshop(
    workshopId: string,
    workOrderId: string,
    input: UpdateWorkOrderPromisesDto,
    actorUserId: string,
  ): Promise<WorkOrderEntity> {
    const workOrder = await this.workOrderModel
      .findOne({
        _id: workOrderId,
        workshopId,
      })
      .exec();

    if (!workOrder) {
      throw new NotFoundException('Work order not found in workshop.');
    }

    if (
      input.promisedDiagnosticAt === undefined &&
      input.promisedDeliveryAt === undefined
    ) {
      throw new BadRequestException(
        'Provide promisedDiagnosticAt or promisedDeliveryAt to update promises.',
      );
    }

    if (!this.canEditPromises(workOrder)) {
      throw new ConflictException(
        `Promises cannot be updated while work order is ${workOrder.status}.`,
      );
    }

    const nextPromisedDiagnosticAt =
      input.promisedDiagnosticAt !== undefined
        ? new Date(input.promisedDiagnosticAt)
        : workOrder.promisedDiagnosticAt;
    const nextPromisedDeliveryAt =
      input.promisedDeliveryAt !== undefined
        ? new Date(input.promisedDeliveryAt)
        : workOrder.promisedDeliveryAt;

    this.validatePromiseUpdate(
      workOrder,
      input,
      nextPromisedDiagnosticAt,
      nextPromisedDeliveryAt,
    );

    const previousPromisedDiagnosticAt = workOrder.promisedDiagnosticAt;
    const previousPromisedDeliveryAt = workOrder.promisedDeliveryAt;

    workOrder.promisedDiagnosticAt = nextPromisedDiagnosticAt;
    workOrder.promisedDeliveryAt = nextPromisedDeliveryAt;
    await workOrder.save();

    await this.auditService.create({
      workshopId,
      entityType: 'work_order',
      entityId: workOrder._id.toString(),
      action: 'work_order_promises_changed',
      actorUserId,
      metadata: {
        fromPromisedDiagnosticAt: previousPromisedDiagnosticAt?.toISOString() ?? null,
        toPromisedDiagnosticAt: workOrder.promisedDiagnosticAt?.toISOString() ?? null,
        fromPromisedDeliveryAt: previousPromisedDeliveryAt?.toISOString() ?? null,
        toPromisedDeliveryAt: workOrder.promisedDeliveryAt?.toISOString() ?? null,
        reason: this.normalizeReason(input.reason),
      },
    });

    await this.notificationsService.registerPromiseChange(
      workshopId,
      workOrder._id.toString(),
      {
        promisedDiagnosticAt: workOrder.promisedDiagnosticAt?.toISOString() ?? null,
        promisedDeliveryAt: workOrder.promisedDeliveryAt?.toISOString() ?? null,
        reason: this.normalizeReason(input.reason),
      },
    );

    return this.toEntity(workOrder);
  }

  private canTransition(
    currentStatus: WorkOrderStatus,
    nextStatus: WorkOrderStatus,
  ): boolean {
    if (currentStatus === nextStatus) {
      return true;
    }

    const allowedTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      scheduled: ['in_operation'],
      reception: ['in_diagnosis'],
      in_diagnosis: ['quote_sent'],
      quote_sent: ['awaiting_approval', 'in_operation', 'closed'],
      awaiting_approval: ['in_operation', 'closed'],
      in_operation: ['ready'],
      ready: ['closed'],
      closed: ['picked_up'],
      picked_up: [],
    };

    return allowedTransitions[currentStatus].includes(nextStatus);
  }

  private canEditPromises(workOrder: WorkOrderDocument): boolean {
    if (workOrder.type === 'direct') {
      return ['scheduled', 'in_operation', 'ready'].includes(workOrder.status);
    }

    return [
      'reception',
      'in_diagnosis',
      'quote_sent',
      'awaiting_approval',
      'in_operation',
      'ready',
    ].includes(workOrder.status);
  }

  private validatePromiseUpdate(
    workOrder: WorkOrderDocument,
    input: UpdateWorkOrderPromisesDto,
    nextPromisedDiagnosticAt: Date | null,
    nextPromisedDeliveryAt: Date | null,
  ): void {
    if (workOrder.type === 'direct' && input.promisedDiagnosticAt !== undefined) {
      throw new ConflictException(
        'Direct work orders do not use promised diagnostic dates.',
      );
    }

    const diagnosticPreOperationStatuses: WorkOrderStatus[] = [
      'reception',
      'in_diagnosis',
      'quote_sent',
      'awaiting_approval',
    ];

    if (
      workOrder.type === 'diagnostic' &&
      diagnosticPreOperationStatuses.includes(workOrder.status) &&
      input.promisedDeliveryAt !== undefined
    ) {
      throw new ConflictException(
        'Diagnostic work orders cannot update delivery promises before operation starts.',
      );
    }

    if (
      workOrder.type === 'diagnostic' &&
      ['in_operation', 'ready'].includes(workOrder.status) &&
      input.promisedDiagnosticAt !== undefined
    ) {
      throw new ConflictException(
        'Diagnostic promise can only be updated before operation starts.',
      );
    }

    if (
      nextPromisedDiagnosticAt &&
      nextPromisedDeliveryAt &&
      nextPromisedDeliveryAt.getTime() < nextPromisedDiagnosticAt.getTime()
    ) {
      throw new ConflictException(
        'Promised delivery date cannot be earlier than promised diagnostic date.',
      );
    }
  }

  private normalizeReason(reason?: string): string | null {
    const normalized = reason?.trim();
    return normalized ? normalized : null;
  }

  private async findDocumentByIdInWorkshop(
    workshopId: string,
    workOrderId: string,
  ): Promise<WorkOrderDocument> {
    const workOrder = await this.workOrderModel
      .findOne({
        _id: workOrderId,
        workshopId,
      })
      .exec();

    if (!workOrder) {
      throw new NotFoundException('Work order not found in workshop.');
    }

    return workOrder;
  }

  private async assertTrackingAccess(
    workshopId: string,
    clientId: string,
    user: CurrentUserContext,
  ): Promise<void> {
    if (user.permissions.includes('workorders.read')) {
      return;
    }

    const customer = await this.customersService.resolvePortalCustomerInWorkshop(
      workshopId,
      user,
    );

    if (!customer || customer.id !== clientId) {
      throw new NotFoundException('Tracking view not found for customer.');
    }
  }

  private toCustomerFacingStatusLabel(status: WorkOrderStatus): string {
    const labels: Record<WorkOrderStatus, string> = {
      scheduled: 'Scheduled with the workshop',
      reception: 'Vehicle received',
      in_diagnosis: 'Vehicle under diagnosis',
      quote_sent: 'Estimate ready for review',
      awaiting_approval: 'Waiting for your approval',
      in_operation: 'Work in progress',
      ready: 'Ready for pickup',
      closed: 'Service completed',
      picked_up: 'Vehicle picked up',
    };

    return labels[status];
  }

  private toVehicleLabel(vehicle: {
    plate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
  }): string {
    const details = [vehicle.brand, vehicle.model, vehicle.year ? `${vehicle.year}` : null]
      .filter((value): value is string => Boolean(value))
      .join(' ');

    return details ? `${vehicle.plate} - ${details}` : vehicle.plate;
  }

  private toEntity(workOrder: WorkOrderDocument): WorkOrderEntity {
    return {
      id: workOrder._id.toString(),
      workshopId: workOrder.workshopId,
      appointmentId: workOrder.appointmentId,
      type: workOrder.type,
      status: workOrder.status,
      phase: workOrder.status,
      clientId: workOrder.clientId,
      vehicleId: workOrder.vehicleId,
      serviceId: workOrder.serviceId,
      estimatedDiagnosticHours: workOrder.estimatedDiagnosticHours,
      estimatedOperationHours: workOrder.estimatedOperationHours,
      promisedDiagnosticAt: workOrder.promisedDiagnosticAt
        ? workOrder.promisedDiagnosticAt.toISOString()
        : null,
      promisedDeliveryAt: workOrder.promisedDeliveryAt
        ? workOrder.promisedDeliveryAt.toISOString()
        : null,
      createdAt: workOrder.createdAt.toISOString(),
    };
  }
}
