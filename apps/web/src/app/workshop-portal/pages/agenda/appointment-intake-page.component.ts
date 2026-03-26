import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  ApiService,
  CustomerViewModel,
  ServiceViewModel,
  VehicleViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';
import {
  formatHours,
  formatVehicleSummary,
} from '../../../shared/utils/display-formatters';

@Component({
  selector: 'at-appointment-intake-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PageShellComponent],
  templateUrl: './appointment-intake-page.component.html',
  styleUrl: './appointment-intake-page.component.scss',
})
export class AppointmentIntakePageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  form = {
    clientId: '',
    vehicleId: '',
    serviceId: '',
    scheduledStartAt: '',
  };
  newCustomer = {
    name: '',
    phone: '',
    email: '',
  };
  newVehicle = {
    plate: '',
    brand: '',
    model: '',
    year: '',
  };
  customerMode: 'select' | 'create' = 'select';
  vehicleMode: 'select' | 'create' = 'select';
  customers: CustomerViewModel[] = [];
  vehicles: VehicleViewModel[] = [];
  services: ServiceViewModel[] = [];
  loading = false;
  customersLoading = true;
  vehiclesLoading = false;
  servicesLoading = true;
  error = '';
  successMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadServices(), this.loadCustomers()]);
  }

  get canSubmit(): boolean {
    return (
      this.form.serviceId.trim().length > 0 &&
      this.form.scheduledStartAt.trim().length > 0 &&
      this.services.length > 0 &&
      this.hasCustomerInput &&
      this.hasVehicleInput
    );
  }

  get selectedService(): ServiceViewModel | null {
    return this.services.find((service) => service.id === this.form.serviceId) ?? null;
  }

  get selectedCustomer(): CustomerViewModel | null {
    return this.customers.find((customer) => customer.id === this.form.clientId) ?? null;
  }

  get selectedVehicle(): VehicleViewModel | null {
    return this.vehicles.find((vehicle) => vehicle.id === this.form.vehicleId) ?? null;
  }

  get hasCustomerInput(): boolean {
    if (this.customerMode === 'create') {
      return this.newCustomer.name.trim().length > 0;
    }

    return this.form.clientId.trim().length > 0;
  }

  get hasVehicleInput(): boolean {
    if (this.customerMode === 'create' || this.vehicleMode === 'create') {
      return this.newVehicle.plate.trim().length > 0;
    }

    return this.form.vehicleId.trim().length > 0;
  }

  async loadCustomers(): Promise<void> {
    this.customersLoading = true;

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = this.i18n.t('intake.loadingCustomersError');
        return;
      }

      this.customers = await this.apiService.listCustomers(token);

      if (!this.customers.length) {
        this.customerMode = 'create';
        this.vehicleMode = 'create';
        this.form.clientId = '';
        this.form.vehicleId = '';
        this.vehicles = [];
        return;
      }

      if (!this.form.clientId) {
        this.form.clientId = this.customers[0].id;
      }

      this.customerMode = 'select';
      await this.loadVehiclesForCustomer(this.form.clientId);
    } catch (error) {
      console.error('Failed to load customers', error);
      this.error = this.i18n.t('intake.loadingCustomersError');
    } finally {
      this.customersLoading = false;
    }
  }

  async loadServices(): Promise<void> {
    this.servicesLoading = true;

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = this.i18n.t('intake.loadingServicesError');
        return;
      }

      this.services = await this.apiService.listServices(token);

      if (this.services.length === 1 && !this.form.serviceId) {
        this.form.serviceId = this.services[0].id;
      }
    } catch (error) {
      console.error('Failed to load services', error);
      this.error = this.i18n.t('intake.loadingServicesError');
    } finally {
      this.servicesLoading = false;
    }
  }

  async onCustomerSelectionChange(): Promise<void> {
    this.form.vehicleId = '';
    await this.loadVehiclesForCustomer(this.form.clientId);
  }

  setCustomerMode(mode: 'select' | 'create'): void {
    this.customerMode = mode;
    this.error = '';

    if (mode === 'create') {
      this.form.clientId = '';
      this.form.vehicleId = '';
      this.vehicleMode = 'create';
      this.vehicles = [];
      return;
    }

    if (!this.customers.length) {
      this.customerMode = 'create';
      this.vehicleMode = 'create';
      return;
    }

    if (!this.form.clientId) {
      this.form.clientId = this.customers[0].id;
    }

    void this.onCustomerSelectionChange();
  }

  setVehicleMode(mode: 'select' | 'create'): void {
    this.vehicleMode = mode;
    this.error = '';

    if (mode === 'create') {
      this.form.vehicleId = '';
      return;
    }

    if (!this.vehicles.length) {
      this.vehicleMode = 'create';
      return;
    }

    if (!this.form.vehicleId) {
      this.form.vehicleId = this.vehicles[0].id;
    }
  }

  async loadVehiclesForCustomer(customerId: string): Promise<void> {
    if (!customerId) {
      this.vehicles = [];
      this.vehicleMode = 'create';
      return;
    }

    this.vehiclesLoading = true;

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = this.i18n.t('intake.loadingVehiclesError');
        return;
      }

      this.vehicles = await this.apiService.listVehicles(token, customerId);
      this.vehicleMode = this.vehicles.length ? 'select' : 'create';
      this.form.vehicleId = this.vehicles.length ? this.vehicles[0].id : '';
    } catch (error) {
      console.error('Failed to load vehicles', error);
      this.error = this.i18n.t('intake.loadingVehiclesError');
      this.vehicles = [];
      this.vehicleMode = 'create';
    } finally {
      this.vehiclesLoading = false;
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) {
      this.error = this.i18n.t('intake.completeFields');
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = this.i18n.t('intake.createAuthError');
        return;
      }

      const customerId =
        this.customerMode === 'create'
          ? (
              await this.apiService.createCustomer(token, {
                name: this.newCustomer.name.trim(),
                phone: this.optionalValue(this.newCustomer.phone),
                email: this.optionalValue(this.newCustomer.email),
              })
            ).id
          : this.form.clientId.trim();

      const vehicleId =
        this.customerMode === 'create' || this.vehicleMode === 'create'
          ? (
              await this.apiService.createVehicle(token, {
                customerId,
                plate: this.newVehicle.plate.trim(),
                brand: this.optionalValue(this.newVehicle.brand),
                model: this.optionalValue(this.newVehicle.model),
                year: this.optionalNumber(this.newVehicle.year),
              })
            ).id
          : this.form.vehicleId.trim();

      const appointment = await this.apiService.createAppointment(token, {
        clientId: customerId,
        vehicleId,
        serviceId: this.form.serviceId.trim(),
        scheduledStartAt: new Date(this.form.scheduledStartAt).toISOString(),
      });

      const workOrder = await this.apiService.createWorkOrderFromAppointment(
        token,
        appointment.id,
      );

      this.successMessage = this.i18n.t('intake.success');
      await this.router.navigate(['/workshop/work-orders', workOrder.id]);
    } catch (error) {
      console.error('Failed to create intake', error);
      this.error = this.i18n.t('intake.createError');
    } finally {
      this.loading = false;
    }
  }

  formatHours(value: number): string {
    return formatHours(value);
  }

  formatVehicleOption(vehicle: VehicleViewModel): string {
    const details = this.describeVehicle(vehicle);
    return details ? ` - ${details}` : '';
  }

  describeVehicle(vehicle: VehicleViewModel): string {
    return formatVehicleSummary(vehicle);
  }

  private optionalValue(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }

  private optionalNumber(value: string): number | undefined {
    const normalized = value.trim();

    if (!normalized) {
      return undefined;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
