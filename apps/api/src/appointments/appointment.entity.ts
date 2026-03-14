export interface AppointmentEntity {
  id: string;
  workshopId: string;
  clientId: string;
  vehicleId: string;
  serviceId: string;
  scheduledStartAt: string;
  estimatedDurationHours: number;
  createdAt: string;
}
