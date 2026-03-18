export interface CustomerEntity {
  id: string;
  workshopId: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
}
