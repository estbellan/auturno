export interface ServiceEntity {
  id: string;
  workshopId: string;
  name: string;
  estimatedDurationHours: number;
  requiresDiagnostic: boolean;
}
