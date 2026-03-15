import { JsonPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment.development';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'at-vertical-slice',
  standalone: true,
  imports: [FormsModule, NgIf, JsonPipe],
  templateUrl: './vertical-slice.component.html',
  styleUrl: './vertical-slice.component.css',
})
export class VerticalSliceComponent {
  token = '';
  workshopName = 'AUTURNO Demo Workshop';
  serviceName = 'Oil Change';
  estimatedDurationHours = 1;
  requiresDiagnostic = false;
  clientId = 'client-001';
  vehicleId = 'vehicle-001';
  scheduledStartAt = new Date().toISOString().slice(0, 16);

  me: unknown;
  workshop: any;
  service: any;
  appointment: any;
  workOrder: any;
  error = '';

  readonly debugEnvironment = environment;

  constructor(
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
  ) {}

  async loginWithAuth0() {
    await this.authService.login();
  }

  async useAuth0Token() {
    const auth0Token = await this.authService.getAccessToken();
    if (auth0Token) {
      this.token = auth0Token;
    }
  }

  async runFlow() {
    this.error = '';

    try {
      this.me = await this.apiService.getMe(this.token);
      this.workshop = await this.apiService.bootstrapWorkshop(this.token, this.workshopName);
      this.service = await this.apiService.createService(this.token, {
        name: this.serviceName,
        estimatedDurationHours: this.estimatedDurationHours,
        requiresDiagnostic: this.requiresDiagnostic,
      });
      this.appointment = await this.apiService.createAppointment(this.token, {
        clientId: this.clientId,
        vehicleId: this.vehicleId,
        serviceId: this.service.id,
        scheduledStartAt: new Date(this.scheduledStartAt).toISOString(),
      });
      this.workOrder = await this.apiService.createWorkOrderFromAppointment(
        this.token,
        this.appointment.id,
      );
    } catch (error: unknown) {
      this.error = JSON.stringify(error);
    }
  }
}
