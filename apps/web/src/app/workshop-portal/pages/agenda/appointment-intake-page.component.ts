import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  ApiService,
  CustomerViewModel,
  ServiceViewModel,
  VehicleViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-appointment-intake-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PageShellComponent],
  template: `
    <section class="intake-page">
      <a class="back-link" routerLink="/workshop/agenda">Back to agenda</a>

      <at-page-shell
        title="New Intake"
        description="Create an appointment and immediately open its work order using the existing backend flow."
      />

      <section class="card form-card">
        <form class="intake-form" (ngSubmit)="submit()">
          <section class="stack-section">
            <div class="section-heading">
              <div>
                <p class="preview-label">Customer</p>
                <strong>Select an existing customer or create one inline.</strong>
              </div>
              <div class="mode-switch">
                <button
                  type="button"
                  class="mode-chip"
                  [class.active]="customerMode === 'select'"
                  [disabled]="customersLoading || !customers.length"
                  (click)="setCustomerMode('select')"
                >
                  Select
                </button>
                <button
                  type="button"
                  class="mode-chip"
                  [class.active]="customerMode === 'create'"
                  [disabled]="customersLoading"
                  (click)="setCustomerMode('create')"
                >
                  New
                </button>
              </div>
            </div>

            @if (customersLoading) {
              <div class="status-card neutral">Loading customers...</div>
            } @else if (customerMode === 'select' && customers.length) {
              <label class="field">
                <span>Customer</span>
                <select
                  name="clientId"
                  [(ngModel)]="form.clientId"
                  required
                  (ngModelChange)="onCustomerSelectionChange()"
                >
                  <option value="" disabled>Select a customer</option>
                  @for (customer of customers; track customer.id) {
                    <option [value]="customer.id">{{ customer.name }}</option>
                  }
                </select>
              </label>

              @if (selectedCustomer) {
                <section class="inline-summary">
                  <span>{{ selectedCustomer.name }}</span>
                  <span>{{ selectedCustomer.phone || selectedCustomer.email || 'No contact details yet' }}</span>
                </section>
              }
            } @else {
              <div class="inline-form-grid">
                <label class="field">
                  <span>Customer name</span>
                  <input
                    type="text"
                    name="newCustomerName"
                    [(ngModel)]="newCustomer.name"
                    required
                  />
                </label>

                <label class="field">
                  <span>Phone</span>
                  <input type="tel" name="newCustomerPhone" [(ngModel)]="newCustomer.phone" />
                </label>

                <label class="field">
                  <span>Email</span>
                  <input type="email" name="newCustomerEmail" [(ngModel)]="newCustomer.email" />
                </label>
              </div>
            }
          </section>

          <section class="stack-section">
            <div class="section-heading">
              <div>
                <p class="preview-label">Vehicle</p>
                <strong>Choose a customer vehicle or register a minimal one.</strong>
              </div>

              @if (customerMode === 'select' && form.clientId) {
                <div class="mode-switch">
                  <button
                    type="button"
                    class="mode-chip"
                    [class.active]="vehicleMode === 'select'"
                    [disabled]="vehiclesLoading || !vehicles.length"
                    (click)="setVehicleMode('select')"
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    class="mode-chip"
                    [class.active]="vehicleMode === 'create'"
                    [disabled]="vehiclesLoading"
                    (click)="setVehicleMode('create')"
                  >
                    New
                  </button>
                </div>
              }
            </div>

            @if (customerMode === 'select' && !form.clientId) {
              <div class="status-card neutral">Choose a customer first to load vehicles.</div>
            } @else if (customerMode === 'select' && vehiclesLoading) {
              <div class="status-card neutral">Loading vehicles...</div>
            } @else if (customerMode === 'select' && vehicleMode === 'select' && vehicles.length) {
              <label class="field">
                <span>Vehicle</span>
                <select name="vehicleId" [(ngModel)]="form.vehicleId" required>
                  <option value="" disabled>Select a vehicle</option>
                  @for (vehicle of vehicles; track vehicle.id) {
                    <option [value]="vehicle.id">{{ vehicle.plate }}{{ formatVehicleOption(vehicle) }}</option>
                  }
                </select>
              </label>

              @if (selectedVehicle) {
                <section class="inline-summary">
                  <span>{{ selectedVehicle.plate }}</span>
                  <span>{{ describeVehicle(selectedVehicle) }}</span>
                </section>
              }
            } @else {
              <div class="inline-form-grid">
                <label class="field">
                  <span>Plate</span>
                  <input type="text" name="newVehiclePlate" [(ngModel)]="newVehicle.plate" required />
                </label>

                <label class="field">
                  <span>Brand</span>
                  <input type="text" name="newVehicleBrand" [(ngModel)]="newVehicle.brand" />
                </label>

                <label class="field">
                  <span>Model</span>
                  <input type="text" name="newVehicleModel" [(ngModel)]="newVehicle.model" />
                </label>

                <label class="field">
                  <span>Year</span>
                  <input
                    type="number"
                    name="newVehicleYear"
                    [(ngModel)]="newVehicle.year"
                    min="1900"
                    max="2100"
                  />
                </label>
              </div>
            }
          </section>

          <label class="field">
            <span>Service</span>
            @if (servicesLoading) {
              <div class="status-card neutral">Loading services...</div>
            } @else if (!services.length) {
              <div class="status-card neutral">No services available for this workshop yet.</div>
            } @else {
              <select name="serviceId" [(ngModel)]="form.serviceId" required>
                <option value="" disabled>Select a service</option>
                @for (service of services; track service.id) {
                  <option [value]="service.id">{{ service.name }}</option>
                }
              </select>
            }
          </label>

          @if (selectedService) {
            <section class="service-preview">
              <div>
                <p class="preview-label">Selected service</p>
                <strong>{{ selectedService.name }}</strong>
              </div>
              <div class="preview-grid">
                <div>
                  <p class="preview-label">Estimated hours</p>
                  <span>{{ formatHours(selectedService.estimatedDurationHours) }}</span>
                </div>
                <div>
                  <p class="preview-label">Flow</p>
                  <span>{{ selectedService.requiresDiagnostic ? 'Requires diagnostic' : 'Direct service' }}</span>
                </div>
              </div>
            </section>
          }

          <label class="field">
            <span>Scheduled start</span>
            <input type="datetime-local" name="scheduledStartAt" [(ngModel)]="form.scheduledStartAt" required />
          </label>

          @if (error) {
            <section class="status-card error">{{ error }}</section>
          }

          @if (successMessage) {
            <section class="status-card success">{{ successMessage }}</section>
          }

          <button
            type="submit"
            [disabled]="loading || customersLoading || vehiclesLoading || servicesLoading || !canSubmit"
          >
            {{ loading ? 'Creating intake...' : 'Create appointment and work order' }}
          </button>
        </form>
      </section>
    </section>
  `,
  styles: [
    `
      .intake-page {
        display: grid;
        gap: 1rem;
      }

      .back-link {
        color: #1d4ed8;
        text-decoration: none;
        font-weight: 600;
      }

      .card {
        border-radius: 16px;
        background: #ffffff;
        border: 1px solid #dbe4f0;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      }

      .form-card {
        padding: 1rem;
      }

      .intake-form {
        display: grid;
        gap: 0.9rem;
      }

      .stack-section {
        display: grid;
        gap: 0.75rem;
        padding: 0.9rem;
        border-radius: 14px;
        border: 1px solid #dbe4f0;
        background: #f8fafc;
      }

      .section-heading {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: flex-start;
      }

      .field {
        display: grid;
        gap: 0.35rem;
      }

      .field span {
        color: #334155;
        font-size: 0.85rem;
        font-weight: 600;
      }

      input,
      select,
      button {
        font: inherit;
      }

      input,
      select {
        width: 100%;
        padding: 0.8rem 0.9rem;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        background: #ffffff;
        color: #0f172a;
      }

      .inline-form-grid {
        display: grid;
        gap: 0.75rem;
      }

      .mode-switch {
        display: inline-flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }

      .mode-chip {
        padding: 0.55rem 0.85rem;
        border-radius: 999px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #334155;
        font-weight: 600;
      }

      .mode-chip.active {
        border-color: #1d4ed8;
        color: #1d4ed8;
        background: #dbeafe;
      }

      .status-card {
        padding: 0.9rem 1rem;
        border-radius: 12px;
        font-weight: 600;
      }

      .neutral {
        color: #334155;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }

      .error {
        color: #991b1b;
        background: #fef2f2;
        border: 1px solid #fecaca;
      }

      .success {
        color: #166534;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
      }

      .service-preview {
        display: grid;
        gap: 0.75rem;
        padding: 0.9rem 1rem;
        border-radius: 14px;
        border: 1px solid #dbe4f0;
        background: #f8fafc;
      }

      .preview-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      .preview-label {
        margin: 0 0 0.2rem;
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      strong,
      .preview-grid span {
        color: #0f172a;
      }

      .inline-summary {
        display: grid;
        gap: 0.2rem;
        color: #334155;
        font-size: 0.9rem;
      }

      button[disabled] {
        opacity: 0.7;
      }

      @media (min-width: 768px) {
        .inline-form-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
  ],
})
export class AppointmentIntakePageComponent implements OnInit {
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
        this.error = 'Unable to load customers without an authenticated session.';
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
      this.error = 'Failed to load customers for intake.';
    } finally {
      this.customersLoading = false;
    }
  }

  async loadServices(): Promise<void> {
    this.servicesLoading = true;

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = 'Unable to load services without an authenticated session.';
        return;
      }

      this.services = await this.apiService.listServices(token);

      if (this.services.length === 1 && !this.form.serviceId) {
        this.form.serviceId = this.services[0].id;
      }
    } catch (error) {
      console.error('Failed to load services', error);
      this.error = 'Failed to load services for intake.';
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
        this.error = 'Unable to load vehicles without an authenticated session.';
        return;
      }

      this.vehicles = await this.apiService.listVehicles(token, customerId);
      this.vehicleMode = this.vehicles.length ? 'select' : 'create';
      this.form.vehicleId = this.vehicles.length ? this.vehicles[0].id : '';
    } catch (error) {
      console.error('Failed to load vehicles', error);
      this.error = 'Failed to load vehicles for the selected customer.';
      this.vehicles = [];
      this.vehicleMode = 'create';
    } finally {
      this.vehiclesLoading = false;
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) {
      this.error = 'Complete all fields before creating the intake.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = 'Unable to create intake without an authenticated session.';
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

      this.successMessage = 'Intake created. Opening work order...';
      await this.router.navigate(['/workshop/work-orders', workOrder.id]);
    } catch (error) {
      console.error('Failed to create intake', error);
      this.error = 'Failed to create appointment and work order.';
    } finally {
      this.loading = false;
    }
  }

  formatHours(value: number): string {
    return `${value}h`;
  }

  formatVehicleOption(vehicle: VehicleViewModel): string {
    const details = this.describeVehicle(vehicle);
    return details ? ` - ${details}` : '';
  }

  describeVehicle(vehicle: VehicleViewModel): string {
    return [vehicle.brand, vehicle.model, vehicle.year ? `${vehicle.year}` : null]
      .filter((value): value is string => Boolean(value))
      .join(' ');
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
