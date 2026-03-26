import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WorkOrderViewModel {
  id: string;
  workshopId: string;
  appointmentId: string;
  type: 'direct' | 'diagnostic';
  status:
    | 'scheduled'
    | 'reception'
    | 'in_diagnosis'
    | 'quote_sent'
    | 'awaiting_approval'
    | 'in_operation'
    | 'ready'
    | 'closed'
    | 'picked_up';
  phase: string;
  clientId: string;
  vehicleId: string;
  serviceId: string;
  estimatedDiagnosticHours: number;
  estimatedOperationHours: number;
  promisedDiagnosticAt: string | null;
  promisedDeliveryAt: string | null;
  createdAt: string;
}

export interface AuditHistoryEventViewModel {
  id: string;
  workshopId: string;
  entityType: 'work_order' | 'diagnostic' | 'quote';
  entityId: string;
  action:
    | 'work_order_created'
    | 'work_order_status_changed'
    | 'work_order_promises_changed'
    | 'diagnostic_created'
    | 'diagnostic_completed'
    | 'quote_created'
    | 'quote_sent'
    | 'quote_approved'
    | 'quote_rejected';
  actorUserId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationOutboxItemViewModel {
  id: string;
  workshopId: string;
  workOrderId: string;
  eventType:
    | 'quote_sent'
    | 'work_order_promises_changed'
    | 'work_order_status_changed';
  messagePreview: string;
  status: 'pending' | 'acknowledged';
  acknowledgedAt: string | null;
  acknowledgedByUserId: string | null;
  createdAt: string;
}

export interface WorkOrderTrackingViewModel {
  workOrderId: string;
  quoteId: string | null;
  type: 'direct' | 'diagnostic';
  currentStatus:
    | 'scheduled'
    | 'reception'
    | 'in_diagnosis'
    | 'quote_sent'
    | 'awaiting_approval'
    | 'in_operation'
    | 'ready'
    | 'closed'
    | 'picked_up';
  customerFacingStatusLabel: string;
  vehicleLabel: string;
  serviceName: string;
  promisedDiagnosticAt: string | null;
  promisedDeliveryAt: string | null;
  quoteStatus: 'draft' | 'sent' | 'approved' | 'rejected' | null;
  lastUpdatedAt: string;
}

export interface ClientProfileViewModel {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface ClientPortalMeViewModel {
  status: 'not_invited' | 'invited' | 'claimed';
  canClaim: boolean;
  customer: ClientProfileViewModel | null;
  invitedAt: string | null;
  claimedAt: string | null;
}

export interface ClientVehicleViewModel {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  createdAt: string;
}

export interface ServiceRequestViewModel {
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

export interface ClientWorkOrderListItemViewModel {
  workOrderId: string;
  type: 'direct' | 'diagnostic';
  currentStatus:
    | 'scheduled'
    | 'reception'
    | 'in_diagnosis'
    | 'quote_sent'
    | 'awaiting_approval'
    | 'in_operation'
    | 'ready'
    | 'closed'
    | 'picked_up';
  customerFacingStatusLabel: string;
  vehicleLabel: string;
  serviceName: string;
  promisedDiagnosticAt: string | null;
  promisedDeliveryAt: string | null;
  quoteStatus: 'draft' | 'sent' | 'approved' | 'rejected' | null;
  lastUpdatedAt: string;
}

export interface CustomerViewModel {
  id: string;
  workshopId: string;
  authSubject: string | null;
  inviteStatus: 'not_invited' | 'invited' | 'claimed';
  name: string;
  phone: string | null;
  email: string | null;
  invitedAt: string | null;
  claimedAt: string | null;
  createdAt: string;
}

export interface VehicleViewModel {
  id: string;
  workshopId: string;
  customerId: string;
  plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  createdAt: string;
}

export interface ServiceViewModel {
  id: string;
  workshopId: string;
  name: string;
  estimatedDurationHours: number;
  requiresDiagnostic: boolean;
}

export interface AppointmentViewModel {
  id: string;
  workshopId: string;
  clientId: string;
  vehicleId: string;
  serviceId: string;
  scheduledStartAt: string;
  estimatedDurationHours: number;
  createdAt: string;
}

export interface DiagnosticViewModel {
  id: string;
  workshopId: string;
  workOrderId: string;
  status: 'draft' | 'completed';
  summary: string;
  notes: string | null;
  estimatedOperationHours: number | null;
  recommendedServices: string[];
  createdByUserId: string;
  completedAt: string | null;
  createdAt: string;
}

export interface QuoteItemViewModel {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteViewModel {
  id: string;
  workshopId: string;
  workOrderId: string;
  diagnosticId: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  items: QuoteItemViewModel[];
  subtotal: number;
  total: number;
  sentAt: string | null;
  respondedAt: string | null;
  createdByUserId: string;
  createdAt: string;
}

export interface CurrentUserViewModel {
  id: string;
  email: string;
  name: string;
  workshopId: string | null;
  roles: Array<'owner' | 'admin' | 'operator' | 'mechanic' | 'client'>;
  permissions: string[];
}

export interface CreateDiagnosticDraftPayload {
  summary: string;
  notes?: string;
  estimatedOperationHours?: number;
  recommendedServices: string[];
}

export interface CreateQuoteItemPayload {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateQuotePayload {
  items: CreateQuoteItemPayload[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  async getMe(token?: string): Promise<CurrentUserViewModel> {
    return firstValueFrom(
      this.http.get<CurrentUserViewModel>(`${environment.apiBaseUrl}/me`, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async bootstrapWorkshop(token: string, workshopName: string) {
    return firstValueFrom(
      this.http.post(
        `${environment.apiBaseUrl}/workshops/bootstrap`,
        { workshopName },
        { headers: this.authHeaders(token) },
      ),
    );
  }

  async createService(token: string, payload: { name: string; estimatedDurationHours: number; requiresDiagnostic: boolean }) {
    return firstValueFrom(
      this.http.post(`${environment.apiBaseUrl}/services`, payload, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async updateService(
    token: string,
    serviceId: string,
    payload: { name: string; estimatedDurationHours: number; requiresDiagnostic: boolean },
  ): Promise<ServiceViewModel> {
    return firstValueFrom(
      this.http.patch<ServiceViewModel>(`${environment.apiBaseUrl}/services/${serviceId}`, payload, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async listServices(token: string): Promise<ServiceViewModel[]> {
    return firstValueFrom(
      this.http.get<ServiceViewModel[]>(`${environment.apiBaseUrl}/services`, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async listCustomers(token: string): Promise<CustomerViewModel[]> {
    return firstValueFrom(
      this.http.get<CustomerViewModel[]>(`${environment.apiBaseUrl}/customers`, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async createCustomer(
    token: string,
    payload: { name: string; phone?: string; email?: string },
  ): Promise<CustomerViewModel> {
    return firstValueFrom(
      this.http.post<CustomerViewModel>(`${environment.apiBaseUrl}/customers`, payload, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async updateCustomer(
    token: string,
    customerId: string,
    payload: { name: string; phone?: string; email?: string },
  ): Promise<CustomerViewModel> {
    return firstValueFrom(
      this.http.patch<CustomerViewModel>(`${environment.apiBaseUrl}/customers/${customerId}`, payload, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async listVehicles(token: string, customerId?: string): Promise<VehicleViewModel[]> {
    return firstValueFrom(
      this.http.get<VehicleViewModel[]>(`${environment.apiBaseUrl}/vehicles`, {
        headers: this.authHeaders(token),
        params: customerId ? { customerId } : {},
      }),
    );
  }

  async createVehicle(
    token: string,
    payload: {
      customerId: string;
      plate: string;
      brand?: string;
      model?: string;
      year?: number;
    },
  ): Promise<VehicleViewModel> {
    return firstValueFrom(
      this.http.post<VehicleViewModel>(`${environment.apiBaseUrl}/vehicles`, payload, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async updateVehicle(
    token: string,
    vehicleId: string,
    payload: {
      plate: string;
      brand?: string;
      model?: string;
      year?: number;
    },
  ): Promise<VehicleViewModel> {
    return firstValueFrom(
      this.http.patch<VehicleViewModel>(`${environment.apiBaseUrl}/vehicles/${vehicleId}`, payload, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async createAppointment(
    token: string,
    payload: { clientId: string; vehicleId: string; serviceId: string; scheduledStartAt: string },
  ): Promise<AppointmentViewModel> {
    return firstValueFrom(
      this.http.post<AppointmentViewModel>(`${environment.apiBaseUrl}/appointments`, payload, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async listAppointments(token: string): Promise<AppointmentViewModel[]> {
    return firstValueFrom(
      this.http.get<AppointmentViewModel[]>(`${environment.apiBaseUrl}/appointments`, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async createWorkOrderFromAppointment(
    token: string,
    appointmentId: string,
  ): Promise<WorkOrderViewModel> {
    return firstValueFrom(
      this.http.post<WorkOrderViewModel>(
        `${environment.apiBaseUrl}/work-orders/from-appointment/${appointmentId}`,
        {},
        { headers: this.authHeaders(token) },
      ),
    );
  }

  async createCustomerInvite(
    token: string,
    customerId: string,
  ): Promise<CustomerViewModel> {
    return firstValueFrom(
      this.http.post<CustomerViewModel>(
        `${environment.apiBaseUrl}/customers/${customerId}/invite`,
        {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async listWorkOrders(token: string): Promise<WorkOrderViewModel[]> {
    return firstValueFrom(
      this.http.get<WorkOrderViewModel[]>(`${environment.apiBaseUrl}/work-orders`, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async getWorkOrder(token: string, workOrderId: string): Promise<WorkOrderViewModel> {
    return firstValueFrom(
      this.http.get<WorkOrderViewModel>(
        `${environment.apiBaseUrl}/work-orders/${workOrderId}`,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async updateWorkOrderPromises(
    token: string,
    workOrderId: string,
    payload: {
      promisedDiagnosticAt?: string;
      promisedDeliveryAt?: string;
      reason?: string;
    },
  ): Promise<WorkOrderViewModel> {
    return firstValueFrom(
      this.http.patch<WorkOrderViewModel>(
        `${environment.apiBaseUrl}/work-orders/${workOrderId}/promises`,
        payload,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async getWorkOrderHistory(
    token: string,
    workOrderId: string,
  ): Promise<AuditHistoryEventViewModel[]> {
    return firstValueFrom(
      this.http.get<AuditHistoryEventViewModel[]>(
        `${environment.apiBaseUrl}/work-orders/${workOrderId}/history`,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async getWorkOrderNotifications(
    token: string,
    workOrderId: string,
  ): Promise<NotificationOutboxItemViewModel[]> {
    return firstValueFrom(
      this.http.get<NotificationOutboxItemViewModel[]>(
        `${environment.apiBaseUrl}/work-orders/${workOrderId}/notifications`,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async acknowledgeWorkOrderNotification(
    token: string,
    workOrderId: string,
    notificationId: string,
  ): Promise<NotificationOutboxItemViewModel> {
    return firstValueFrom(
      this.http.patch<NotificationOutboxItemViewModel>(
        `${environment.apiBaseUrl}/work-orders/${workOrderId}/notifications/${notificationId}/acknowledge`,
        {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async getClientWorkOrderTracking(
    token: string,
    workOrderId: string,
  ): Promise<WorkOrderTrackingViewModel> {
    return firstValueFrom(
      this.http.get<WorkOrderTrackingViewModel>(
        `${environment.apiBaseUrl}/work-orders/${workOrderId}/tracking`,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async getClientProfile(token: string): Promise<ClientPortalMeViewModel> {
    return firstValueFrom(
      this.http.get<ClientPortalMeViewModel>(`${environment.apiBaseUrl}/client/me`, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async claimClientProfile(token: string): Promise<ClientPortalMeViewModel> {
    return firstValueFrom(
      this.http.post<ClientPortalMeViewModel>(
        `${environment.apiBaseUrl}/client/claim`,
        {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async updateClientProfile(
    token: string,
    payload: { name: string; phone?: string; email?: string },
  ): Promise<ClientProfileViewModel> {
    return firstValueFrom(
      this.http.patch<ClientProfileViewModel>(
        `${environment.apiBaseUrl}/client/me`,
        payload,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async listClientVehicles(token: string): Promise<ClientVehicleViewModel[]> {
    return firstValueFrom(
      this.http.get<ClientVehicleViewModel[]>(
        `${environment.apiBaseUrl}/client/vehicles`,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async createClientVehicle(
    token: string,
    payload: {
      plate: string;
      brand?: string;
      model?: string;
      year?: number;
    },
  ): Promise<ClientVehicleViewModel> {
    return firstValueFrom(
      this.http.post<ClientVehicleViewModel>(
        `${environment.apiBaseUrl}/client/vehicles`,
        payload,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async listClientServices(token: string): Promise<ServiceViewModel[]> {
    return firstValueFrom(
      this.http.get<ServiceViewModel[]>(
        `${environment.apiBaseUrl}/client/services`,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async updateClientVehicle(
    token: string,
    vehicleId: string,
    payload: {
      plate: string;
      brand?: string;
      model?: string;
      year?: number;
    },
  ): Promise<ClientVehicleViewModel> {
    return firstValueFrom(
      this.http.patch<ClientVehicleViewModel>(
        `${environment.apiBaseUrl}/client/vehicles/${vehicleId}`,
        payload,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async listClientWorkOrders(
    token: string,
  ): Promise<ClientWorkOrderListItemViewModel[]> {
    return firstValueFrom(
      this.http.get<ClientWorkOrderListItemViewModel[]>(
        `${environment.apiBaseUrl}/client/work-orders`,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async listClientServiceRequests(
    token: string,
  ): Promise<ServiceRequestViewModel[]> {
    return firstValueFrom(
      this.http.get<ServiceRequestViewModel[]>(
        `${environment.apiBaseUrl}/client/service-requests`,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async createClientServiceRequest(
    token: string,
    payload: {
      vehicleId: string;
      serviceId: string;
      preferredDateTime?: string;
      preferredDate?: string;
      comment?: string;
    },
  ): Promise<ServiceRequestViewModel> {
    return firstValueFrom(
      this.http.post<ServiceRequestViewModel>(
        `${environment.apiBaseUrl}/client/service-requests`,
        payload,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async listWorkshopServiceRequests(
    token: string,
  ): Promise<ServiceRequestViewModel[]> {
    return firstValueFrom(
      this.http.get<ServiceRequestViewModel[]>(
        `${environment.apiBaseUrl}/service-requests`,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async updateWorkshopServiceRequestStatus(
    token: string,
    serviceRequestId: string,
    status: 'reviewed' | 'accepted' | 'rejected',
  ): Promise<ServiceRequestViewModel> {
    return firstValueFrom(
      this.http.patch<ServiceRequestViewModel>(
        `${environment.apiBaseUrl}/service-requests/${serviceRequestId}/status`,
        { status },
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async convertWorkshopServiceRequest(
    token: string,
    serviceRequestId: string,
    payload?: { scheduledStartAt?: string },
  ): Promise<{ serviceRequest: ServiceRequestViewModel; appointmentId: string }> {
    return firstValueFrom(
      this.http.post<{ serviceRequest: ServiceRequestViewModel; appointmentId: string }>(
        `${environment.apiBaseUrl}/service-requests/${serviceRequestId}/convert-to-appointment`,
        payload ?? {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async submitCustomerQuoteResponse(
    token: string,
    quoteId: string,
    payload: { decision: 'approve' | 'reject'; comment?: string },
  ): Promise<QuoteViewModel> {
    return firstValueFrom(
      this.http.patch<QuoteViewModel>(
        `${environment.apiBaseUrl}/quotes/${quoteId}/customer-response`,
        payload,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async getDiagnosticByWorkOrder(
    token: string,
    workOrderId: string,
  ): Promise<DiagnosticViewModel> {
    return firstValueFrom(
      this.http.get<DiagnosticViewModel>(
        `${environment.apiBaseUrl}/diagnostics/work-order/${workOrderId}`,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async createDiagnosticDraft(
    token: string,
    workOrderId: string,
    payload: CreateDiagnosticDraftPayload,
  ): Promise<DiagnosticViewModel> {
    return firstValueFrom(
      this.http.post<DiagnosticViewModel>(
        `${environment.apiBaseUrl}/diagnostics/work-order/${workOrderId}`,
        payload,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async completeDiagnostic(token: string, diagnosticId: string): Promise<DiagnosticViewModel> {
    return firstValueFrom(
      this.http.patch<DiagnosticViewModel>(
        `${environment.apiBaseUrl}/diagnostics/${diagnosticId}/complete`,
        {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async getQuoteByWorkOrder(token: string, workOrderId: string): Promise<QuoteViewModel> {
    return firstValueFrom(
      this.http.get<QuoteViewModel>(
        `${environment.apiBaseUrl}/quotes/work-order/${workOrderId}`,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async createQuote(
    token: string,
    diagnosticId: string,
    payload: CreateQuotePayload,
  ): Promise<QuoteViewModel> {
    return firstValueFrom(
      this.http.post<QuoteViewModel>(
        `${environment.apiBaseUrl}/quotes/from-diagnostic/${diagnosticId}`,
        payload,
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async sendQuote(token: string, quoteId: string): Promise<QuoteViewModel> {
    return firstValueFrom(
      this.http.patch<QuoteViewModel>(
        `${environment.apiBaseUrl}/quotes/${quoteId}/send`,
        {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async startOperation(token: string, workOrderId: string): Promise<WorkOrderViewModel> {
    return firstValueFrom(
      this.http.patch<WorkOrderViewModel>(
        `${environment.apiBaseUrl}/work-orders/${workOrderId}/start-operation`,
        {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async markWorkOrderReady(token: string, workOrderId: string): Promise<WorkOrderViewModel> {
    return firstValueFrom(
      this.http.patch<WorkOrderViewModel>(
        `${environment.apiBaseUrl}/work-orders/${workOrderId}/mark-ready`,
        {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async closeWorkOrder(token: string, workOrderId: string): Promise<WorkOrderViewModel> {
    return firstValueFrom(
      this.http.patch<WorkOrderViewModel>(
        `${environment.apiBaseUrl}/work-orders/${workOrderId}/close`,
        {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async pickUpWorkOrder(token: string, workOrderId: string): Promise<WorkOrderViewModel> {
    return firstValueFrom(
      this.http.patch<WorkOrderViewModel>(
        `${environment.apiBaseUrl}/work-orders/${workOrderId}/pick-up`,
        {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async approveQuote(token: string, quoteId: string): Promise<QuoteViewModel> {
    return firstValueFrom(
      this.http.patch<QuoteViewModel>(
        `${environment.apiBaseUrl}/quotes/${quoteId}/approve`,
        {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  async rejectQuote(token: string, quoteId: string): Promise<QuoteViewModel> {
    return firstValueFrom(
      this.http.patch<QuoteViewModel>(
        `${environment.apiBaseUrl}/quotes/${quoteId}/reject`,
        {},
        {
          headers: this.authHeaders(token),
        },
      ),
    );
  }

  private authHeaders(token?: string): HttpHeaders | undefined {
    if (!token) {
      return undefined;
    }

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
