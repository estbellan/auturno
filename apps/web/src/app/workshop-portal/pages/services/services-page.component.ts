import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, ServiceViewModel } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-services-page',
  standalone: true,
  imports: [FormsModule, PageShellComponent],
  template: `
    <section class="services-page">
      <at-page-shell
        title="Services"
        description="Manage the workshop service catalog used by intake and work-order creation."
      />

      <section class="card form-card">
        <div class="section-copy">
          <h2>Create service</h2>
          <p>Add a service with its estimated duration and whether it starts in diagnosis.</p>
        </div>

        <form class="service-form" (ngSubmit)="submit()">
          <label class="field">
            <span>Name</span>
            <input type="text" name="name" [(ngModel)]="form.name" required />
          </label>

          <label class="field">
            <span>Estimated hours</span>
            <input
              type="number"
              name="estimatedDurationHours"
              [(ngModel)]="form.estimatedDurationHours"
              min="0.5"
              step="0.5"
              required
            />
          </label>

          <label class="toggle-field">
            <input
              type="checkbox"
              name="requiresDiagnostic"
              [(ngModel)]="form.requiresDiagnostic"
            />
            <span>Requires diagnostic before operation</span>
          </label>

          @if (formError) {
            <section class="status-card error">{{ formError }}</section>
          }

          @if (successMessage) {
            <section class="status-card success">{{ successMessage }}</section>
          }

          <button type="submit" [disabled]="submitting || !canSubmit">
            {{ submitting ? 'Creating service...' : 'Create service' }}
          </button>
        </form>
      </section>

      <section class="card list-card">
        <div class="section-copy">
          <h2>Current services</h2>
          <p>These services are available to workshop intake.</p>
        </div>

        @if (loading) {
          <section class="status-card neutral">Loading services...</section>
        } @else if (listError) {
          <section class="status-card error">{{ listError }}</section>
        } @else if (!services.length) {
          <section class="status-card neutral">No services created yet.</section>
        } @else {
          <div class="service-list">
            @for (service of services; track service.id) {
              <article
                class="service-card"
                [class.diagnostic-service]="service.requiresDiagnostic"
              >
                <div class="service-header">
                  <div>
                    <p class="eyebrow">Service</p>
                    <h3>{{ service.name }}</h3>
                  </div>

                  @if (service.requiresDiagnostic) {
                    <span class="service-badge diagnostic">Diagnostic flow</span>
                  } @else {
                    <span class="service-badge direct">Direct service</span>
                  }
                </div>

                <div class="service-details">
                  <div>
                    <p class="detail-label">Estimated hours</p>
                    <span>{{ formatHours(service.estimatedDurationHours) }}</span>
                  </div>
                  <div>
                    <p class="detail-label">Service ID</p>
                    <span>{{ service.id }}</span>
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
      .services-page {
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
      .section-copy p {
        margin: 0;
      }

      .section-copy h2,
      .service-header h3 {
        color: #0f172a;
      }

      .section-copy p {
        color: #64748b;
      }

      .service-form {
        display: grid;
        gap: 0.9rem;
      }

      .field {
        display: grid;
        gap: 0.35rem;
      }

      .field span,
      .detail-label,
      .eyebrow {
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

      input[type='text'],
      input[type='number'] {
        width: 100%;
        padding: 0.8rem 0.9rem;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        background: #ffffff;
        color: #0f172a;
      }

      .toggle-field {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        color: #334155;
        font-weight: 600;
      }

      .toggle-field input {
        width: 1rem;
        height: 1rem;
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

      .service-list {
        display: grid;
        gap: 0.9rem;
      }

      .service-card {
        display: grid;
        gap: 0.9rem;
        padding: 1rem;
        border-radius: 14px;
        border: 1px solid #dbe4f0;
        background: #f8fafc;
      }

      .service-card.diagnostic-service {
        border-color: #bfdbfe;
        background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
      }

      .service-header {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: flex-start;
      }

      .service-header h3,
      .service-header p {
        margin: 0;
      }

      .service-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.45rem 0.7rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 700;
      }

      .service-badge.diagnostic {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .service-badge.direct {
        background: #e2e8f0;
        color: #334155;
      }

      .service-details {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .service-details span {
        color: #334155;
        word-break: break-word;
      }

      @media (min-width: 768px) {
        .service-form {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: end;
        }

        .toggle-field,
        .status-card,
        button {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
})
export class ServicesPageComponent implements OnInit {
  services: ServiceViewModel[] = [];
  loading = true;
  submitting = false;
  listError = '';
  formError = '';
  successMessage = '';
  form = {
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

  get canSubmit(): boolean {
    return (
      this.form.name.trim().length > 0 &&
      Number.isFinite(this.form.estimatedDurationHours) &&
      this.form.estimatedDurationHours > 0
    );
  }

  async loadServices(): Promise<void> {
    this.loading = true;
    this.listError = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.listError = 'Unable to load services without an authenticated session.';
        return;
      }

      this.services = await this.apiService.listServices(token);
    } catch (error) {
      console.error('Failed to load services', error);
      this.listError = 'Failed to load services for this workshop.';
    } finally {
      this.loading = false;
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit) {
      this.formError = 'Enter a service name and a valid estimated duration.';
      return;
    }

    this.submitting = true;
    this.formError = '';
    this.successMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.formError = 'Unable to create services without an authenticated session.';
        return;
      }

      await this.apiService.createService(token, {
        name: this.form.name.trim(),
        estimatedDurationHours: this.form.estimatedDurationHours,
        requiresDiagnostic: this.form.requiresDiagnostic,
      });

      this.successMessage = 'Service created.';
      this.form = {
        name: '',
        estimatedDurationHours: 1,
        requiresDiagnostic: false,
      };

      await this.loadServices();
    } catch (error) {
      console.error('Failed to create service', error);
      this.formError = this.resolveCreateError(error);
    } finally {
      this.submitting = false;
    }
  }

  formatHours(value: number): string {
    return `${value}h`;
  }

  private resolveCreateError(error: unknown): string {
    if (
      error instanceof HttpErrorResponse &&
      error.status === 409
    ) {
      return 'A service with this name already exists in this workshop.';
    }

    return 'Failed to create service.';
  }
}
