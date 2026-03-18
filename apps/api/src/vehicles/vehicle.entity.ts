export interface VehicleEntity {
  id: string;
  workshopId: string;
  customerId: string;
  plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  createdAt: string;
}
