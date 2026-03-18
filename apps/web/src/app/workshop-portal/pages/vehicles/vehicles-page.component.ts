import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ApiService,
  CustomerViewModel,
  VehicleViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-vehicles-page',
  standalone: true,
  imports: [FormsModule, PageShellComponent],
  template: `
    <section class="vehicles-page">
      <at-page-shell
        title="Vehicles"
        description="Manage workshop vehicles linked to existing customers."
      />

      <section class="card form-card">
        <div class="section-copy">
          <h2>Create vehicle</h2>
          <p>Add a minimal vehicle record and attach it to a workshop customer.</p>
        </div>

        <form class="vehicle-form" (ngSubmit)="submit()">
          <label class="field">
            <span>Customer</span>
            @if (customersLoading) {
              <div class="status-card neutral">Loading customers...</div>
            } @else if (!customers.length) {
              <div class="status-card neutral">Create a customer first before adding vehicles.</div>
            } @else {
              <select name="customerId" [(ngModel)]="form.customerId" required>
                <option value="" disabled>Select a customer</option>
                @for (customer of customers; track customer.id) {
                  <option [value]="customer.id">{{ customer.name }}</option>
                }
              </select>
            }
          </label>

          <label class="field">
            <span>Plate</span>
            <input type="text" name="plate" [(ngModel)]="form.plate" required />
          </label>

          <label class="field">
            <span>Brand</span>
            <input type="text" name="brand" [(ngModel)]="form.brand" />
          </label>

          <label class="field">
            <span>Model</span>
            <input type="text" name="model" [(ngModel)]="form.model" />
          </label>

          <label class="field">
            <span>Year</span>
            <input type="number" name="year" [(ngModel)]="form.year" min="1900" max="2100" />
          </label>

          @if (formError) {
            <section class="status-card error">{{ formError }}</section>
          }

          @if (successMessage) {
            <section class="status-card success">{{ successMessage }}</section>
          }

          <button type="submit" [disabled]="submitting || customersLoading || !canSubmit">
            {{ submitting ? 'Creating vehicle...' : 'Create vehicle' }}
          </button>
        </form>
      </section>

      <section class="card list-card">
        <div class="section-copy">
          <h2>Vehicle list</h2>
          <p>Search locally by plate, brand, or model.</p>
        </div>

        <label class="field">
          <span>Search</span>
          <input type="search" name="search" [(ngModel)]="searchTerm" placeholder="Search by plate, brand, or model" />
        </label>

        @if (loading) {
          <section class="status-card neutral">Loading vehicles...</section>
        } @else if (listError) {
          <section class="status-card error">{{ listError }}</section>
        } @else if (!filteredVehicles.length) {
          <section class="status-card neutral">No vehicles match this search yet.</section>
        } @else {
          <div class="vehicle-list">
            @for (vehicle of filteredVehicles; track vehicle.id) {
              <article class="vehicle-card">
                <div class="vehicle-header">
                  <div>
                    <p class="eyebrow">Vehicle</p>
                    <h3>{{ vehicle.plate }}</h3>
                  </div>
                  <span class="customer-chip">{{ customerName(vehicle.customerId) }}</span>
                </div>

                <div class="vehicle-details">
                  <div>
                    <p class="detail-label">Brand</p>
                    <span>{{ vehicle.brand || 'Not provided' }}</span>
                  </div>
                  <div>
                    <p class="detail-label">Model</p>
                    <span>{{ vehicle.model || 'Not provided' }}</span>
                  </div>
                  <div>
                    <p class="detail-label">Year</p>
                    <span>{{ vehicle.year || 'Not provided' }}</span>
                  </div>
                  <div>
                    <p class="detail-label">Customer</p>
                    <span>{{ customerName(vehicle.customerId) }}</span>
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .vehicles-page {
        display: grid;
        gap: 1rem;
      }

      .card {
        border-radius: 16px;
        background: #ffffff;
        border: 1px solid #dbe4f0;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      }

      .form-card,
      .list-card {
        display: grid;
        gap: 0.9rem;
        padding: 1rem;
      }

      .section-copy {
        display: grid;
        gap: 0.35rem;
      }

      .section-copy h2,
      .section-copy p,
      .vehicle-card h3,
      .vehicle-card p {
        margin: 0;
      }

      .section-copy h2,
      .vehicle-card h3 {
        color: #0f172a;
      }

      .section-copy p {
        color: #64748b;
      }

      .vehicle-form {
        display: grid;
        gap: 0.9rem;
      }

      .field {
        display: grid;
        gap: 0.35rem;
      }

      .field span,
      .eyebrow,
      .detail-label {
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
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

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.8rem 1rem;
        border: none;
        border-radius: 12px;
        background: #1d4ed8;
        color: #ffffff;
        font-weight: 600;
      }

      button[disabled] {
        opacity: 0.7;
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

      .vehicle-list {
        display: grid;
        gap: 0.9rem;
      }

      .vehicle-card {
        display: grid;
        gap: 0.9rem;
        padding: 1rem;
        border-radius: 14px;
        border: 1px solid #dbe4f0;
        background: #f8fafc;
      }

      .vehicle-header {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: flex-start;
      }

      .customer-chip {
        display: inline-flex;
        align-items: center;
        padding: 0.45rem 0.7rem;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 0.8rem;
        font-weight: 700;
      }

      .vehicle-details {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .vehicle-details span {
        color: #334155;
        word-break: break-word;
      }

      @media (min-width: 768px) {
        .vehicle-form {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .vehicle-form .field:first-child,
        .vehicle-form .status-card,
        .vehicle-form button {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
})
export class VehiclesPageComponent implements OnInit {
  customers: CustomerViewModel[] = [];
  vehicles: VehicleViewModel[] = [];
  loading = true;
  customersLoading = true;
  submitting = false;
  listError = '';
  formError = '';
  successMessage = '';
  searchTerm = '';
  form = {
    customerId: '',
    plate: '',
    brand: '',
    model: '',
    year: '',
  };

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadCustomers(), this.loadVehicles()]);
  }

  get canSubmit(): boolean {
    return (
      this.form.customerId.trim().length > 0 &&
      this.form.plate.trim().length > 0
    );
  }

  get filteredVehicles(): VehicleViewModel[] {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.vehicles;
    }

    return this.vehicles.filter((vehicle) =>
      [vehicle.plate, vehicle.brand, vehicle.model]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(search)),
    );
  }

  async loadCustomers(): Promise<void> {
    this.customersLoading = true;

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.formError = 'Unable to load customers without an authenticated session.';
        return;
      }

      this.customers = await this.apiService.listCustomers(token);

      if (this.customers.length === 1 && !this.form.customerId) {
        this.form.customerId = this.customers[0].id;
      }
    } catch (error) {
      console.error('Failed to load customers for vehicles page', error);
      this.formError = 'Failed to load customers for vehicle creation.';
    } finally {
      this.customersLoading = false;
    }
  }

  async loadVehicles(): Promise<void> {
    this.loading = true;
    this.listError = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.listError = 'Unable to load vehicles without an authenticated session.';
        return;
      }

      this.vehicles = await this.apiService.listVehicles(token);
    } catch (error) {
      console.error('Failed to load vehicles', error);
      this.listError = 'Failed to load vehicles for this workshop.';
    } finally {
      this.loading = false;
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) {
      this.formError = 'Select a customer and enter a plate before creating the vehicle.';
      return;
    }

    this.submitting = true;
    this.formError = '';
    this.successMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.formError = 'Unable to create vehicles without an authenticated session.';
        return;
      }

      await this.apiService.createVehicle(token, {
        customerId: this.form.customerId.trim(),
        plate: this.form.plate.trim(),
        brand: this.optionalValue(this.form.brand),
        model: this.optionalValue(this.form.model),
        year: this.optionalNumber(this.form.year),
      });

      this.form = {
        customerId: this.customers.length === 1 ? this.customers[0].id : '',
        plate: '',
        brand: '',
        model: '',
        year: '',
      };
      this.successMessage = 'Vehicle created.';
      await this.loadVehicles();
    } catch (error) {
      console.error('Failed to create vehicle', error);
      this.formError = this.resolveCreateError(error);
    } finally {
      this.submitting = false;
    }
  }

  customerName(customerId: string): string {
    return this.customers.find((customer) => customer.id === customerId)?.name ?? customerId;
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

  private resolveCreateError(error: unknown): string {
    if (
      error instanceof HttpErrorResponse &&
      error.status === 409
    ) {
      return 'A vehicle with this plate already exists in this workshop.';
    }

    return 'Failed to create vehicle.';
  }
}
