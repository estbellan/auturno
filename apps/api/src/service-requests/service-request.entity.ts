export interface ServiceRequestEntity {
  id: string;
  workshopId: string;
  customerId: string;
  vehicleId: string;
  serviceId: string;
  preferredDateTime: string | null;
  preferredDate: string | null;
  comment: string | null;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'converted';
  appointmentId: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  createdAt: string;
}
