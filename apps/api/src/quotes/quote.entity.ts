export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected';

export interface QuoteItemEntity {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteEntity {
  id: string;
  workshopId: string;
  workOrderId: string;
  diagnosticId: string;
  status: QuoteStatus;
  items: QuoteItemEntity[];
  subtotal: number;
  total: number;
  sentAt: string | null;
  respondedAt: string | null;
  createdByUserId: string;
  createdAt: string;
}
