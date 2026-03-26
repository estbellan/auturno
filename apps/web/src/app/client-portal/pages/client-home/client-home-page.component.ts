import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ApiService,
  ClientPortalMeViewModel,
  ClientProfileViewModel,
  ClientVehicleViewModel,
  ClientWorkOrderListItemViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import {
  formatDateTime,
  formatVehicleSummary,
  humanizeToken,
} from '../../../shared/utils/display-formatters';

@Component({
  selector: 'at-client-home-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './client-home-page.component.html',
  styleUrl: './client-home-page.component.scss',
})
export class ClientHomePageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  portalMe: ClientPortalMeViewModel | null = null;
  profile: ClientProfileViewModel | null = null;
  vehicles: ClientVehicleViewModel[] = [];
  workOrders: ClientWorkOrderListItemViewModel[] = [];
  loading = true;
  error = '';

  editingProfile = false;
  savingProfile = false;
  profileError = '';
  profileForm = {
    name: '',
    phone: '',
    email: '',
  };

  editingVehicleId: string | 'new' | null = null;
  savingVehicle = false;
  vehicleError = '';
  claimSubmitting = false;
  claimError = '';
  vehicleForm = {
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
    await this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.claimError = '';

    try {
      const token = await this.requireToken();
      const portalMe = await this.apiService.getClientProfile(token);
      this.portalMe = portalMe;
      this.profile = portalMe.customer;

      if (portalMe.status === 'claimed' && portalMe.customer) {
        const [vehicles, workOrders] = await Promise.all([
          this.apiService.listClientVehicles(token),
          this.apiService.listClientWorkOrders(token),
        ]);
        this.vehicles = vehicles;
        this.workOrders = workOrders;
      } else {
        this.vehicles = [];
        this.workOrders = [];
      }

      this.cancelProfileEdit();
      this.cancelVehicleEdit();
    } catch (error) {
      console.error('Failed to load client dashboard', error);
      this.error = this.toMessage(
        error,
        this.i18n.t('client.home.error'),
      );
    } finally {
      this.loading = false;
    }
  }

  async claimPortalAccess(): Promise<void> {
    this.claimSubmitting = true;
    this.claimError = '';

    try {
      const token = await this.requireToken();
      this.portalMe = await this.apiService.claimClientProfile(token);
      await this.loadDashboard();
    } catch (error) {
      console.error('Failed to claim client portal access', error);
      this.claimError = this.toMessage(
        error,
        this.i18n.t('client.home.claimError'),
      );
    } finally {
      this.claimSubmitting = false;
    }
  }

  startProfileEdit(): void {
    if (!this.profile) {
      return;
    }

    this.profileError = '';
    this.editingProfile = true;
    this.profileForm = {
      name: this.profile.name,
      phone: this.profile.phone ?? '',
      email: this.profile.email ?? '',
    };
  }

  cancelProfileEdit(): void {
    this.editingProfile = false;
    this.savingProfile = false;
    this.profileError = '';
  }

  async saveProfile(): Promise<void> {
    this.savingProfile = true;
    this.profileError = '';

    try {
      const token = await this.requireToken();
      await this.apiService.updateClientProfile(token, {
        name: this.profileForm.name,
        phone: this.profileForm.phone || undefined,
        email: this.profileForm.email || undefined,
      });
      await this.loadDashboard();
    } catch (error) {
      console.error('Failed to save client profile', error);
      this.profileError = this.toMessage(
        error,
        this.i18n.t('client.home.profileSaveError'),
      );
    } finally {
      this.savingProfile = false;
    }
  }

  startCreateVehicle(): void {
    this.editingVehicleId = 'new';
    this.savingVehicle = false;
    this.vehicleError = '';
    this.vehicleForm = {
      plate: '',
      brand: '',
      model: '',
      year: '',
    };
  }

  startEditVehicle(vehicle: ClientVehicleViewModel): void {
    this.editingVehicleId = vehicle.id;
    this.savingVehicle = false;
    this.vehicleError = '';
    this.vehicleForm = {
      plate: vehicle.plate,
      brand: vehicle.brand ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year ? `${vehicle.year}` : '',
    };
  }

  cancelVehicleEdit(): void {
    this.editingVehicleId = null;
    this.savingVehicle = false;
    this.vehicleError = '';
    this.vehicleForm = {
      plate: '',
      brand: '',
      model: '',
      year: '',
    };
  }

  async saveVehicle(): Promise<void> {
    this.savingVehicle = true;
    this.vehicleError = '';

    try {
      const token = await this.requireToken();
      const payload = {
        plate: this.vehicleForm.plate,
        brand: this.vehicleForm.brand || undefined,
        model: this.vehicleForm.model || undefined,
        year: this.vehicleForm.year ? Number(this.vehicleForm.year) : undefined,
      };

      if (this.editingVehicleId === 'new') {
        await this.apiService.createClientVehicle(token, payload);
      } else if (this.editingVehicleId) {
        await this.apiService.updateClientVehicle(
          token,
          this.editingVehicleId,
          payload,
        );
      }

      await this.loadDashboard();
    } catch (error) {
      console.error('Failed to save client vehicle', error);
      this.vehicleError =
        error instanceof HttpErrorResponse && error.status === 409
          ? this.i18n.t('client.home.vehicleDuplicate')
          : this.toMessage(error, this.i18n.t('client.home.vehicleSaveError'));
    } finally {
      this.savingVehicle = false;
    }
  }

  formatDate(value: string | null): string {
    return formatDateTime(value, this.i18n.t('common.notSetYet'));
  }

  formatToken(value: string | null): string {
    return humanizeToken(value, this.i18n.t('common.notSet'));
  }

  formatQuoteStatus(value: string | null): string {
    return value ? humanizeToken(value) : this.i18n.t('client.home.quotePending');
  }

  describeVehicle(vehicle: ClientVehicleViewModel): string {
    const summary = formatVehicleSummary(vehicle);
    return summary || this.i18n.t('client.home.vehicleDetailsLimited');
  }

  private async requireToken(): Promise<string> {
    const token = await this.authService.getAccessToken();

    if (!token) {
      throw new Error(this.i18n.t('client.home.authError'));
    }

    return token;
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
