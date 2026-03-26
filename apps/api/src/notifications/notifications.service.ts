import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { WorkOrderStatus } from '../work-orders/schemas/work-order.schema';
import {
  NotificationEntity,
  NotificationEventType,
} from './notification.entity';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async registerQuoteSent(
    workshopId: string,
    workOrderId: string,
  ): Promise<NotificationEntity> {
    return await this.create({
      workshopId,
      workOrderId,
      eventType: 'quote_sent',
      messagePreview: 'Quote shared with the customer and awaiting response.',
    });
  }

  async registerPromiseChange(
    workshopId: string,
    workOrderId: string,
    input: {
      promisedDiagnosticAt: string | null;
      promisedDeliveryAt: string | null;
      reason?: string | null;
    },
  ): Promise<NotificationEntity> {
    const promiseTarget = input.promisedDeliveryAt
      ? `delivery promise updated to ${this.formatDate(input.promisedDeliveryAt)}`
      : input.promisedDiagnosticAt
        ? `diagnostic promise updated to ${this.formatDate(input.promisedDiagnosticAt)}`
        : 'customer promise updated';
    const reasonSuffix = input.reason ? ` Reason: ${input.reason}.` : '.';

    return await this.create({
      workshopId,
      workOrderId,
      eventType: 'work_order_promises_changed',
      messagePreview: `${this.capitalize(promiseTarget)}${reasonSuffix}`,
    });
  }

  async registerStatusChange(
    workshopId: string,
    workOrderId: string,
    nextStatus: WorkOrderStatus,
  ): Promise<NotificationEntity | null> {
    const messagePreview = this.statusMessage(nextStatus);

    if (!messagePreview) {
      return null;
    }

    return await this.create({
      workshopId,
      workOrderId,
      eventType: 'work_order_status_changed',
      messagePreview,
    });
  }

  async listByWorkOrder(
    workshopId: string,
    workOrderId: string,
  ): Promise<NotificationEntity[]> {
    const notifications = await this.notificationModel
      .find({
        workshopId,
        workOrderId,
      })
      .sort({ createdAt: -1, _id: -1 })
      .exec();

    return notifications.map((notification) => this.toEntity(notification));
  }

  async acknowledge(
    workshopId: string,
    workOrderId: string,
    notificationId: string,
    actorUserId: string,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationModel
      .findOne({
        _id: notificationId,
        workshopId,
        workOrderId,
      })
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found for work order.');
    }

    if (notification.status === 'acknowledged') {
      return this.toEntity(notification);
    }

    notification.status = 'acknowledged';
    notification.acknowledgedAt = new Date();
    notification.acknowledgedByUserId = actorUserId;
    await notification.save();

    return this.toEntity(notification);
  }

  private async create(input: {
    workshopId: string;
    workOrderId: string;
    eventType: NotificationEventType;
    messagePreview: string;
  }): Promise<NotificationEntity> {
    const created = await this.notificationModel.create({
      workshopId: input.workshopId,
      workOrderId: input.workOrderId,
      eventType: input.eventType,
      messagePreview: input.messagePreview,
      status: 'pending',
      acknowledgedAt: null,
      acknowledgedByUserId: null,
    });

    return this.toEntity(created);
  }

  private statusMessage(nextStatus: WorkOrderStatus): string | null {
    const messages: Partial<Record<WorkOrderStatus, string>> = {
      awaiting_approval: 'Workshop is waiting for the customer to approve the quote.',
      in_operation: 'Work on the vehicle has started.',
      ready: 'Vehicle marked ready for pickup.',
      closed: 'Work order closed by the workshop.',
      picked_up: 'Vehicle marked as picked up.',
    };

    return messages[nextStatus] ?? null;
  }

  private formatDate(value: string): string {
    return new Date(value).toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    });
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private toEntity(notification: NotificationDocument): NotificationEntity {
    return {
      id: notification._id.toString(),
      workshopId: notification.workshopId,
      workOrderId: notification.workOrderId,
      eventType: notification.eventType,
      messagePreview: notification.messagePreview,
      status: notification.status,
      acknowledgedAt: notification.acknowledgedAt
        ? notification.acknowledgedAt.toISOString()
        : null,
      acknowledgedByUserId: notification.acknowledgedByUserId,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
