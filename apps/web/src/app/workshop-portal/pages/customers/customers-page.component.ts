import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, CustomerViewModel } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-customers-page',
  standalone: true,
  imports: [FormsModule, PageShellComponent],
  template: `
    <section class="customers-page">
      <at-page-shell
        title="Customers"
        description="Manage workshop customers used across intake, vehicles, and work orders."
      />

      <section class="card form-card">
        <div class="section-copy">
          <h2>Create customer</h2>
          <p>Add a minimal customer record for workshop intake.</p>
        </div>

        <form class="customer-form" (ngSubmit)="submit()">
          <label class="field">
            <span>Name</span>
            <input type="text" name="name" [(ngModel)]="form.name" required />
          </label>

          <label class="field">
            <span>Phone</span>
            <input type="tel" name="phone" [(ngModel)]="form.phone" />
          </label>

          <label class="field">
            <span>Email</span>
            <input type="email" name="email" [(ngModel)]="form.email" />
          </label>

          @if (formError) {
            <section class="status-card error">{{ formError }}</section>
          }

          @if (successMessage) {
            <section class="status-card success">{{ successMessage }}</section>
          }

          <button type="submit" [disabled]="submitting || !canSubmit">
            {{ submitting ? 'Creating customer...' : 'Create customer' }}
          </button>
        </form>
      </section>

      <section class="card list-card">
        <div class="section-copy">
          <h2>Customer list</h2>
          <p>Search locally by customer name.</p>
        </div>

        <label class="field">
          <span>Search</span>
          <input type="search" name="search" [(ngModel)]="searchTerm" placeholder="Search by name" />
        </label>

        @if (loading) {
          <section class="status-card neutral">Loading customers...</section>
        } @else if (listError) {
          <section class="status-card error">{{ listError }}</section>
        } @else if (!filteredCustomers.length) {
          <section class="status-card neutral">No customers match this search yet.</section>
        } @else {
          <div class="customer-list">
            @for (customer of filteredCustomers; track customer.id) {
              <article class="customer-card">
                <div>
                  <p class="eyebrow">Customer</p>
                  <h3>{{ customer.name }}</h3>
                </div>

                <div class="customer-details">
                  <div>
                    <p class="detail-label">Phone</p>
                    <span>{{ customer.phone || 'Not provided' }}</span>
                  </div>
                  <div>
                    <p class="detail-label">Email</p>
                    <span>{{ customer.email || 'Not provided' }}</span>
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
      .customers-page {
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
      .section-copy h3,
      .section-copy p,
      .customer-card h3,
      .customer-card p {
        margin: 0;
      }

      .section-copy h2,
      .customer-card h3 {
        color: #0f172a;
      }

      .section-copy p {
        color: #64748b;
      }

      .customer-form {
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
      button {
        font: inherit;
      }

      input {
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

      .customer-list {
        display: grid;
        gap: 0.9rem;
      }

      .customer-card {
        display: grid;
        gap: 0.9rem;
        padding: 1rem;
        border-radius: 14px;
        border: 1px solid #dbe4f0;
        background: #f8fafc;
      }

      .customer-details {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .customer-details span {
        color: #334155;
        word-break: break-word;
      }

      @media (min-width: 768px) {
        .customer-form {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .customer-form .field:first-child,
        .customer-form .status-card,
        .customer-form button {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
})
export class CustomersPageComponent implements OnInit {
  customers: CustomerViewModel[] = [];
  loading = true;
  submitting = false;
  listError = '';
  formError = '';
  successMessage = '';
  searchTerm = '';
  form = {
    name: '',
    phone: '',
    email: '',
  };

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCustomers();
  }

  get canSubmit(): boolean {
    return this.form.name.trim().length > 0;
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
        this.listError = 'Unable to load customers without an authenticated session.';
        return;
      }

      this.customers = await this.apiService.listCustomers(token);
    } catch (error) {
      console.error('Failed to load customers', error);
      this.listError = 'Failed to load customers for this workshop.';
    } finally {
      this.loading = false;
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) {
      this.formError = 'Enter a customer name before creating the record.';
      return;
    }

    this.submitting = true;
    this.formError = '';
    this.successMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.formError = 'Unable to create customers without an authenticated session.';
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
      this.successMessage = 'Customer created.';
      await this.loadCustomers();
    } catch (error) {
      console.error('Failed to create customer', error);
      this.formError = 'Failed to create customer.';
    } finally {
      this.submitting = false;
    }
  }

  private optionalValue(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }
}
