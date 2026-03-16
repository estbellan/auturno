export type WorkOrderType = 'direct' | 'diagnostic';
export type WorkOrderStatus =
  | 'scheduled'
  | 'reception'
  | 'in_diagnosis'
  | 'quote_sent'
  | 'awaiting_approval'
  | 'in_operation'
  | 'ready'
  | 'closed'
  | 'picked_up';

export interface WorkOrderEntity {
  id: string;
  workshopId: string;
  appointmentId: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  phase: WorkOrderStatus;
  clientId: string;
  vehicleId: string;
  serviceId: string;
  estimatedDiagnosticHours: number;
  estimatedOperationHours: number;
  promisedDiagnosticAt: string | null;
  promisedDeliveryAt: string | null;
  createdAt: string;
}
