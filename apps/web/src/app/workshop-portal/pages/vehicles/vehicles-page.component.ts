import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ApiService,
  CustomerViewModel,
  VehicleViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

interface VehicleEditForm {
  plate: string;
  brand: string;
  model: string;
  year: string;
}

@Component({
  selector: 'at-vehicles-page',
  standalone: true,
  imports: [FormsModule, PageShellComponent],
  templateUrl: './vehicles-page.component.html',
  styleUrl: './vehicles-page.component.scss',
})
export class VehiclesPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  customers: CustomerViewModel[] = [];
  vehicles: VehicleViewModel[] = [];
  loading = true;
  customersLoading = true;
  submitting = false;
  editingSubmitting = false;
  listError = '';
  formError = '';
  successMessage = '';
  editError = '';
  searchTerm = '';
  editingVehicleId: string | null = null;
  editForm: VehicleEditForm | null = null;
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

  get canSubmitEdit(): boolean {
    return this.editForm !== null && this.editForm.plate.trim().length > 0;
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
        this.formError = this.i18n.t('vehicles.authError');
        return;
      }

      this.customers = await this.apiService.listCustomers(token);

      if (this.customers.length === 1 && !this.form.customerId) {
        this.form.customerId = this.customers[0].id;
      }
    } catch (error) {
      console.error('Failed to load customers for vehicles page', error);
      this.formError = this.i18n.t('vehicles.authError');
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
        this.listError = this.i18n.t('vehicles.authError');
        return;
      }

      this.vehicles = await this.apiService.listVehicles(token);
    } catch (error) {
      console.error('Failed to load vehicles', error);
      this.listError = this.i18n.t('vehicles.error');
    } finally {
      this.loading = false;
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) {
      this.formError = this.i18n.t('vehicles.nameRequired');
      return;
    }

    this.submitting = true;
    this.formError = '';
    this.successMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.formError = this.i18n.t('vehicles.authErrorCreate');
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
      this.successMessage = this.i18n.t('vehicles.createSuccess');
      await this.loadVehicles();
    } catch (error) {
      console.error('Failed to create vehicle', error);
      this.formError = this.resolveCreateError(error);
    } finally {
      this.submitting = false;
    }
  }

  startEditing(vehicle: VehicleViewModel): void {
    this.editingVehicleId = vehicle.id;
    this.editError = '';
    this.editForm = {
      plate: vehicle.plate,
      brand: vehicle.brand ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year?.toString() ?? '',
    };
  }

  cancelEditing(): void {
    this.editingVehicleId = null;
    this.editForm = null;
    this.editError = '';
  }

  async saveEdit(vehicleId: string): Promise<void> {
    if (!this.canSubmitEdit || !this.editForm) {
      this.editError = this.i18n.t('vehicles.nameRequiredEdit');
      return;
    }

    this.editingSubmitting = true;
    this.editError = '';
    this.successMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.editError = this.i18n.t('vehicles.authErrorUpdate');
        return;
      }

      await this.apiService.updateVehicle(token, vehicleId, {
        plate: this.editForm.plate.trim(),
        brand: this.optionalValue(this.editForm.brand),
        model: this.optionalValue(this.editForm.model),
        year: this.optionalNumber(this.editForm.year),
      });

      this.cancelEditing();
      this.successMessage = this.i18n.t('vehicles.updateSuccess');
      await this.loadVehicles();
    } catch (error) {
      console.error('Failed to update vehicle', error);
      this.editError = this.resolveUpdateError(error);
    } finally {
      this.editingSubmitting = false;
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
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return this.i18n.t('vehicles.duplicateError');
    }

    return this.i18n.t('vehicles.createError');
  }

  private resolveUpdateError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return this.i18n.t('vehicles.duplicateError');
    }

    return this.i18n.t('vehicles.updateError');
  }
}
