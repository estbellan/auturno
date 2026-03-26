export type AuditEntityType = 'work_order' | 'diagnostic' | 'quote' | 'customer';

export type AuditEventAction =
  | 'work_order_created'
  | 'work_order_status_changed'
  | 'work_order_promises_changed'
  | 'diagnostic_created'
  | 'diagnostic_completed'
  | 'quote_created'
  | 'quote_sent'
  | 'quote_approved'
  | 'quote_rejected'
  | 'customer_invited'
  | 'customer_claimed';

export interface AuditEntity {
  id: string;
  workshopId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditEventAction;
  actorUserId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
