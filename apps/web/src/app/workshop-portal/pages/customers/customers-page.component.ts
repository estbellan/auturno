import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, CustomerViewModel } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

interface CustomerEditForm {
  name: string;
  phone: string;
  email: string;
}

@Component({
  selector: 'at-customers-page',
  standalone: true,
  imports: [DatePipe, FormsModule, PageShellComponent],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.scss',
})
export class CustomersPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  customers: CustomerViewModel[] = [];
  loading = true;
  submitting = false;
  editingSubmitting = false;
  inviteSubmittingId = '';
  listError = '';
  formError = '';
  successMessage = '';
  editError = '';
  searchTerm = '';
  editingCustomerId: string | null = null;
  editForm: CustomerEditForm | null = null;
  form = {
    name: '',
    phone: '',
    email: '',
  };

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadCustomers();
  }

  get canSubmit(): boolean {
    return this.form.name.trim().length > 0;
  }

  get canSubmitEdit(): boolean {
    return this.editForm !== null && this.editForm.name.trim().length > 0;
  }

  get filteredCustomers(): CustomerViewModel[] {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.customers;
    }

    return this.customers.filter((customer) =>
      customer.name.toLowerCase().includes(search),
    );
  }

  async loadCustomers(): Promise<void> {
    this.loading = true;
    this.listError = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.listError = this.i18n.t('customers.authError');
        return;
      }

      this.customers = await this.apiService.listCustomers(token);
    } catch (error) {
      console.error('Failed to load customers', error);
      this.listError = this.i18n.t('customers.error');
    } finally {
      this.loading = false;
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) {
      this.formError = this.i18n.t('customers.nameRequired');
      return;
    }

    this.submitting = true;
    this.formError = '';
    this.successMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.formError = this.i18n.t('customers.authError');
        return;
      }

      await this.apiService.createCustomer(token, {
        name: this.form.name.trim(),
        phone: this.optionalValue(this.form.phone),
        email: this.optionalValue(this.form.email),
      });

      this.form = {
        name: '',
        phone: '',
        email: '',
      };
      this.successMessage = this.i18n.t('customers.createSuccess');
      await this.loadCustomers();
    } catch (error) {
      console.error('Failed to create customer', error);
      this.formError = this.i18n.t('customers.createError');
    } finally {
      this.submitting = false;
    }
  }

  startEditing(customer: CustomerViewModel): void {
    this.editingCustomerId = customer.id;
    this.editError = '';
    this.editForm = {
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
    };
  }

  cancelEditing(): void {
    this.editingCustomerId = null;
    this.editForm = null;
    this.editError = '';
  }

  async saveEdit(customerId: string): Promise<void> {
    if (!this.canSubmitEdit || !this.editForm) {
      this.editError = this.i18n.t('customers.nameRequiredEdit');
      return;
    }

    this.editingSubmitting = true;
    this.editError = '';
    this.successMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.editError = this.i18n.t('customers.authError');
        return;
      }

      await this.apiService.updateCustomer(token, customerId, {
        name: this.editForm.name.trim(),
        phone: this.optionalValue(this.editForm.phone),
        email: this.optionalValue(this.editForm.email),
      });

      this.cancelEditing();
      this.successMessage = this.i18n.t('customers.updateSuccess');
      await this.loadCustomers();
    } catch (error) {
      console.error('Failed to update customer', error);
      this.editError = this.i18n.t('customers.updateError');
    } finally {
      this.editingSubmitting = false;
    }
  }

  async inviteCustomer(customer: CustomerViewModel): Promise<void> {
    if (!customer.email || customer.inviteStatus === 'claimed') {
      return;
    }

    this.inviteSubmittingId = customer.id;
    this.listError = '';
    this.successMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.listError = this.i18n.t('customers.authError');
        return;
      }

      await this.apiService.createCustomerInvite(token, customer.id);
      this.successMessage =
        customer.inviteStatus === 'invited'
          ? this.i18n.t('customers.reInviteSuccess')
          : this.i18n.t('customers.inviteSuccess');
      await this.loadCustomers();
    } catch (error) {
      console.error('Failed to invite customer', error);
      this.listError = this.i18n.t('customers.inviteError');
    } finally {
      this.inviteSubmittingId = '';
    }
  }

  formatInviteStatus(status: CustomerViewModel['inviteStatus']): string {
    switch (status) {
      case 'invited':
        return this.i18n.t('customers.inviteStatus.invited');
      case 'claimed':
        return this.i18n.t('customers.inviteStatus.claimed');
      default:
        return this.i18n.t('customers.inviteStatus.none');
    }
  }

  private optionalValue(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }
}
