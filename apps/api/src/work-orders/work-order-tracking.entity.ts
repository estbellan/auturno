import { WorkOrderStatus, WorkOrderType } from './work-order.entity';

export interface WorkOrderTrackingEntity {
  workOrderId: string;
  quoteId: string | null;
  type: WorkOrderType;
  currentStatus: WorkOrderStatus;
  customerFacingStatusLabel: string;
  vehicleLabel: string;
  serviceName: string;
  promisedDiagnosticAt: string | null;
  promisedDeliveryAt: string | null;
  quoteStatus: 'draft' | 'sent' | 'approved' | 'rejected' | null;
  lastUpdatedAt: string;
}
