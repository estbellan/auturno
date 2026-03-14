export type WorkOrderType = 'direct' | 'diagnostic';

export interface WorkOrderEntity {
  id: string;
  workshopId: string;
  appointmentId: string;
  type: WorkOrderType;
  phase: 'scheduled' | 'reception';
  clientId: string;
  vehicleId: string;
  serviceId: string;
  estimatedDiagnosticHours: number;
  estimatedOperationHours: number;
  promisedDiagnosticAt: string | null;
  promisedDeliveryAt: string;
  createdAt: string;
}
