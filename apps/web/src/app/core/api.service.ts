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

export interface CustomerViewModel {
  id: string;
  workshopId: string;
  name: string;
  phone: string | null;
  email: string | null;
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

  async getMe(token: string) {
    return firstValueFrom(this.http.get(`${environment.apiBaseUrl}/me`, { headers: this.authHeaders(token) }));
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

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
