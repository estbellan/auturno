import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, ServiceViewModel } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-services-page',
  standalone: true,
  imports: [FormsModule, PageShellComponent],
  templateUrl: './services-page.component.html',
  styleUrl: './services-page.component.scss',
})
export class ServicesPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  services: ServiceViewModel[] = [];
  loading = true;
  submitting = false;
  editingLoading = false;
  editingServiceId: string | null = null;
  listError = '';
  formError = '';
  editError = '';
  successMessage = '';
  createForm = {
    name: '',
    estimatedDurationHours: 1,
    requiresDiagnostic: false,
  };
  editForm = {
    name: '',
    estimatedDurationHours: 1,
    requiresDiagnostic: false,
  };

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadServices();
  }

  get canSubmitCreate(): boolean {
    return this.isValidForm(this.createForm);
  }

  get canSubmitEdit(): boolean {
    return this.isValidForm(this.editForm);
  }

  async loadServices(): Promise<void> {
    this.loading = true;
    this.listError = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.listError = this.i18n.t('vehicles.authError');
        return;
      }

      this.services = await this.apiService.listServices(token);
    } catch (error) {
      console.error('Failed to load services', error);
      this.listError = this.i18n.t('services.createError');
    } finally {
      this.loading = false;
    }
  }

  startEdit(service: ServiceViewModel): void {
    this.editingServiceId = service.id;
    this.editError = '';
    this.successMessage = '';
    this.editForm = {
      name: service.name,
      estimatedDurationHours: service.estimatedDurationHours,
      requiresDiagnostic: service.requiresDiagnostic,
    };
  }

  cancelEdit(): void {
    this.editingServiceId = null;
    this.editError = '';
  }

  async submitCreate(): Promise<void> {
    if (!this.canSubmitCreate) {
      this.formError = this.i18n.t('services.nameRequired');
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

      await this.apiService.createService(token, {
        name: this.createForm.name.trim(),
        estimatedDurationHours: this.createForm.estimatedDurationHours,
        requiresDiagnostic: this.createForm.requiresDiagnostic,
      });

      this.successMessage = this.i18n.t('services.createSuccess');
      this.createForm = {
        name: '',
        estimatedDurationHours: 1,
        requiresDiagnostic: false,
      };

      await this.loadServices();
    } catch (error) {
      console.error('Failed to create service', error);
      this.formError = this.resolveConflictError(error);
    } finally {
      this.submitting = false;
    }
  }

  async submitEdit(serviceId: string): Promise<void> {
    if (!this.canSubmitEdit) {
      this.editError = this.i18n.t('services.nameRequired');
      return;
    }

    this.editingLoading = true;
    this.editError = '';
    this.successMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.editError = this.i18n.t('vehicles.authErrorUpdate');
        return;
      }

      await this.apiService.updateService(token, serviceId, {
        name: this.editForm.name.trim(),
        estimatedDurationHours: this.editForm.estimatedDurationHours,
        requiresDiagnostic: this.editForm.requiresDiagnostic,
      });

      this.successMessage = this.i18n.t('services.updateSuccess');
      this.editingServiceId = null;
      await this.loadServices();
    } catch (error) {
      console.error('Failed to update service', error);
      this.editError = this.resolveConflictError(error);
    } finally {
      this.editingLoading = false;
    }
  }

  formatHours(value: number): string {
    return `${value}h`;
  }

  private isValidForm(form: {
    name: string;
    estimatedDurationHours: number;
    requiresDiagnostic: boolean;
  }): boolean {
    return (
      form.name.trim().length > 0 &&
      Number.isFinite(form.estimatedDurationHours) &&
      form.estimatedDurationHours > 0
    );
  }

  private resolveConflictError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return this.i18n.t('services.duplicateError');
    }

    return this.i18n.t('services.createError');
  }
}
