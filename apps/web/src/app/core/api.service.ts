import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

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

  async createAppointment(token: string, payload: { clientId: string; vehicleId: string; serviceId: string; scheduledStartAt: string }) {
    return firstValueFrom(
      this.http.post(`${environment.apiBaseUrl}/appointments`, payload, {
        headers: this.authHeaders(token),
      }),
    );
  }

  async createWorkOrderFromAppointment(token: string, appointmentId: string) {
    return firstValueFrom(
      this.http.post(
        `${environment.apiBaseUrl}/work-orders/from-appointment/${appointmentId}`,
        {},
        { headers: this.authHeaders(token) },
      ),
    );
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
