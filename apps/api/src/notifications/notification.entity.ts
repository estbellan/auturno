export type NotificationEventType =
  | 'quote_sent'
  | 'work_order_promises_changed'
  | 'work_order_status_changed';

export type NotificationStatus = 'pending' | 'acknowledged';

export interface NotificationEntity {
  id: string;
  workshopId: string;
  workOrderId: string;
  eventType: NotificationEventType;
  messagePreview: string;
  status: NotificationStatus;
  acknowledgedAt: string | null;
  acknowledgedByUserId: string | null;
  createdAt: string;
}
