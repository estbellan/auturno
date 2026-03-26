import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ApiService,
  ClientPortalMeViewModel,
  ClientVehicleViewModel,
  ServiceRequestViewModel,
  ServiceViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';
import {
  formatDateTime,
  formatVehicleSummary,
  humanizeToken,
} from '../../../shared/utils/display-formatters';

@Component({
  selector: 'at-appointment-request-page',
  standalone: true,
  imports: [FormsModule, PageShellComponent],
  templateUrl: './appointment-request-page.component.html',
  styleUrl: './appointment-request-page.component.scss',
})
export class AppointmentRequestPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  portalMe: ClientPortalMeViewModel | null = null;
  vehicles: ClientVehicleViewModel[] = [];
  services: ServiceViewModel[] = [];
  requests: ServiceRequestViewModel[] = [];
  loading = true;
  submitting = false;
  error = '';
  formError = '';
  successMessage = '';
  form = {
    vehicleId: '',
    serviceId: '',
    preferredDateTime: '',
    comment: '',
  };

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadPage();
  }

  get canSubmit(): boolean {
    return (
      this.form.vehicleId.trim().length > 0 &&
      this.form.serviceId.trim().length > 0 &&
      this.form.preferredDateTime.trim().length > 0
    );
  }

  async loadPage(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const token = await this.requireToken();
      this.portalMe = await this.apiService.getClientProfile(token);

      if (this.portalMe.status === 'claimed') {
        const [vehicles, services, requests] = await Promise.all([
          this.apiService.listClientVehicles(token),
          this.apiService.listClientServices(token),
          this.apiService.listClientServiceRequests(token),
        ]);

        this.vehicles = vehicles;
        this.services = services;
        this.requests = requests;

        if (!this.form.vehicleId && vehicles.length) {
          this.form.vehicleId = vehicles[0].id;
        }

        if (!this.form.serviceId && services.length) {
          this.form.serviceId = services[0].id;
        }
      } else {
        this.vehicles = [];
        this.services = [];
        this.requests = [];
      }
    } catch (error) {
      console.error('Failed to load service request page', error);
      this.error = this.toMessage(
        error,
        this.i18n.t('client.requests.error'),
      );
    } finally {
      this.loading = false;
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) {
      this.formError = this.i18n.t('client.requests.completeRequired');
      return;
    }

    this.submitting = true;
    this.formError = '';
    this.successMessage = '';

    try {
      const token = await this.requireToken();
      await this.apiService.createClientServiceRequest(token, {
        vehicleId: this.form.vehicleId,
        serviceId: this.form.serviceId,
        preferredDateTime: new Date(this.form.preferredDateTime).toISOString(),
        comment: this.optionalValue(this.form.comment),
      });

      this.form.preferredDateTime = '';
      this.form.comment = '';
      this.successMessage = this.i18n.t('client.requests.success');
      await this.loadPage();
    } catch (error) {
      console.error('Failed to create service request', error);
      this.formError = this.toMessage(
        error,
        this.i18n.t('client.requests.submitError'),
      );
    } finally {
      this.submitting = false;
    }
  }

  vehicleSummary(vehicle: ClientVehicleViewModel): string {
    const details = formatVehicleSummary(vehicle);
    return details ? ` - ${details}` : '';
  }

  vehicleName(vehicleId: string): string {
    const vehicle = this.vehicles.find((item) => item.id === vehicleId);
    return vehicle
      ? `${vehicle.plate}${this.vehicleSummary(vehicle)}`
      : this.i18n.t('client.requests.vehicleMissing');
  }

  serviceName(serviceId: string): string {
    return this.services.find((service) => service.id === serviceId)?.name
      ?? this.i18n.t('client.requests.serviceMissing');
  }

  preferredLabel(request: ServiceRequestViewModel): string {
    return request.preferredDateTime
      ? this.formatDate(request.preferredDateTime)
      : request.preferredDate ?? this.i18n.t('client.requests.noPreference');
  }

  formatDate(value: string | null): string {
    return formatDateTime(value, 'Not set');
  }

  formatStatus(status: ServiceRequestViewModel['status']): string {
    return humanizeToken(status);
  }

  private async requireToken(): Promise<string> {
    const token = await this.authService.getAccessToken();

    if (!token) {
      throw new Error(this.i18n.t('client.requests.authError'));
    }

    return token;
  }

  private optionalValue(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }

  private toMessage(error: unknown, fallback: string): string {
    if (
      error instanceof HttpErrorResponse &&
      typeof error.error?.message === 'string'
    ) {
      return error.error.message;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}
