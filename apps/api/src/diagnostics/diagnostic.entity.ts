export type DiagnosticStatus = 'draft' | 'completed';

export interface DiagnosticEntity {
  id: string;
  workshopId: string;
  workOrderId: string;
  status: DiagnosticStatus;
  summary: string;
  notes: string | null;
  estimatedOperationHours: number | null;
  recommendedServices: string[];
  createdByUserId: string;
  completedAt: string | null;
  createdAt: string;
}
