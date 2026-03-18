import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, WorkOrderViewModel } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

type WorkOrderStatus = WorkOrderViewModel['status'];
type WorkOrderType = WorkOrderViewModel['type'];

@Component({
  selector: 'at-work-orders-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PageShellComponent],
  template: `
    <section class="work-orders-page">
      <at-page-shell
        title="Work Orders"
        description="Operational board for direct and diagnostic work orders with backend-managed status transitions."
      />

      <section class="card filters-card">
        <div class="filters-header">
          <div>
            <h2>Board</h2>
            <p>{{ visibleCount }} visible of {{ totalCount }} total</p>
          </div>
          <button type="button" [disabled]="loading" (click)="loadWorkOrders()">
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        <div class="filters-grid">
          <label class="field">
            <span>Search</span>
            <input
              type="text"
              name="search"
              [(ngModel)]="searchTerm"
              placeholder="Client or vehicle"
            />
          </label>

          <label class="field">
            <span>Status</span>
            <select name="status" [(ngModel)]="selectedStatus">
              @for (option of statusOptions; track option.value) {
                <option [ngValue]="option.value">{{ option.label }}</option>
              }
            </select>
          </label>

          <label class="field">
            <span>Type</span>
            <select name="type" [(ngModel)]="selectedType">
              @for (option of typeOptions; track option.value) {
                <option [ngValue]="option.value">{{ option.label }}</option>
              }
            </select>
          </label>
        </div>

        @if (hasActiveFilters) {
          <button type="button" class="secondary clear-button" (click)="clearFilters()">
            Clear filters
          </button>
        }
      </section>

      @if (loading) {
        <section class="card status-card">Loading work orders...</section>
      } @else if (error) {
        <section class="card status-card error">{{ error }}</section>
      } @else if (!workOrders.length) {
        <section class="card status-card">
          No work orders found for this workshop yet.
        </section>
      } @else if (!filteredWorkOrders.length) {
        <section class="card status-card">
          No work orders match the current filters.
        </section>
      } @else {
        <section class="work-order-list">
          @for (workOrder of filteredWorkOrders; track workOrder.id) {
            <a class="work-order-card" [routerLink]="['/workshop/work-orders', workOrder.id]">
              <div class="card-topline">
                <span class="type-chip" [class.diagnostic]="workOrder.type === 'diagnostic'">
                  {{ workOrder.type }}
                </span>
                <span class="status-chip" [class]="statusClassName(workOrder.status)">
                  {{ formatStatus(workOrder.status) }}
                </span>
              </div>

              <div class="identity-block">
                <div>
                  <p class="eyebrow">Client</p>
                  <strong>{{ workOrder.clientId }}</strong>
                </div>
                <div>
                  <p class="eyebrow">Vehicle</p>
                  <strong>{{ workOrder.vehicleId }}</strong>
                </div>
              </div>

              <dl class="card-grid">
                <div>
                  <dt>Diagnostic ETA</dt>
                  <dd>{{ formatDate(workOrder.promisedDiagnosticAt) }}</dd>
                </div>
                <div>
                  <dt>Delivery ETA</dt>
                  <dd>{{ formatDate(workOrder.promisedDeliveryAt) }}</dd>
                </div>
              </dl>
            </a>
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      .work-orders-page {
        display: grid;
        gap: 1rem;
      }

      .card,
      .work-order-card {
        border-radius: 16px;
        background: #ffffff;
        border: 1px solid #dbe4f0;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      }

      .filters-card,
      .status-card {
        padding: 1rem;
      }

      .filters-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .filters-header h2,
      .filters-header p,
      .eyebrow,
      dt,
      dd {
        margin: 0;
      }

      .filters-header h2 {
        color: #0f172a;
        font-size: 1rem;
      }

      .filters-header p {
        color: #64748b;
        font-size: 0.85rem;
      }

      .filters-grid {
        display: grid;
        gap: 0.85rem;
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

      .clear-button {
        margin-top: 0.85rem;
      }

      .error {
        color: #991b1b;
        background: #fef2f2;
        border-color: #fecaca;
      }

      .work-order-list {
        display: grid;
        gap: 0.75rem;
      }

      .work-order-card {
        display: grid;
        gap: 0.9rem;
        padding: 1rem;
        text-decoration: none;
        color: inherit;
      }

      .card-topline,
      .identity-block {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .type-chip,
      .status-chip {
        display: inline-flex;
        align-items: center;
        padding: 0.38rem 0.72rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: capitalize;
      }

      .type-chip {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .type-chip.diagnostic {
        background: #fef3c7;
        color: #b45309;
      }

      .status-chip {
        background: #e2e8f0;
        color: #334155;
      }

      .status-scheduled,
      .status-reception {
        background: #e0f2fe;
        color: #0369a1;
      }

      .status-in-diagnosis,
      .status-in-operation {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .status-quote-sent,
      .status-awaiting-approval {
        background: #fef3c7;
        color: #b45309;
      }

      .status-ready {
        background: #dcfce7;
        color: #15803d;
      }

      .status-closed,
      .status-picked-up {
        background: #ede9fe;
        color: #6d28d9;
      }

      .identity-block strong {
        color: #0f172a;
        font-size: 1rem;
      }

      .eyebrow {
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 0.2rem;
      }

      .card-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.8rem;
        margin: 0;
      }

      dt {
        color: #64748b;
        font-size: 0.8rem;
        font-weight: 600;
        margin-bottom: 0.2rem;
      }

      dd {
        color: #0f172a;
        font-weight: 600;
      }

      .secondary {
        background: #334155;
      }

      button[disabled] {
        opacity: 0.7;
      }

      @media (min-width: 768px) {
        .filters-grid,
        .card-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
  ],
})
export class WorkOrdersPageComponent implements OnInit {
  workOrders: WorkOrderViewModel[] = [];
  searchTerm = '';
  selectedStatus: WorkOrderStatus | 'all' = 'all';
  selectedType: WorkOrderType | 'all' = 'all';
  loading = true;
  error = '';

  readonly statusOptions: Array<{ value: WorkOrderStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'reception', label: 'Reception' },
    { value: 'in_diagnosis', label: 'In diagnosis' },
    { value: 'quote_sent', label: 'Quote sent' },
    { value: 'awaiting_approval', label: 'Awaiting approval' },
    { value: 'in_operation', label: 'In operation' },
    { value: 'ready', label: 'Ready' },
    { value: 'closed', label: 'Closed' },
    { value: 'picked_up', label: 'Picked up' },
  ];

  readonly typeOptions: Array<{ value: WorkOrderType | 'all'; label: string }> = [
    { value: 'all', label: 'All types' },
    { value: 'direct', label: 'Direct' },
    { value: 'diagnostic', label: 'Diagnostic' },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadWorkOrders();
  }

  get filteredWorkOrders(): WorkOrderViewModel[] {
    return this.workOrders.filter((workOrder) => this.matchesFilters(workOrder));
  }

  get totalCount(): number {
    return this.workOrders.length;
  }

  get visibleCount(): number {
    return this.filteredWorkOrders.length;
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim().length > 0 ||
      this.selectedStatus !== 'all' ||
      this.selectedType !== 'all'
    );
  }

  async loadWorkOrders(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = 'Unable to load work orders without an authenticated session.';
        return;
      }

      this.workOrders = await this.apiService.listWorkOrders(token);
    } catch (error) {
      console.error('Failed to load work orders', error);
      this.error = 'Failed to load work orders from the backend.';
    } finally {
      this.loading = false;
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedType = 'all';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatDate(value: string | null): string {
    if (!value) {
      return 'Not set';
    }

    return new Date(value).toLocaleString();
  }

  statusClassName(status: WorkOrderStatus): string {
    return `status-${status.replace(/_/g, '-')}`;
  }

  private matchesFilters(workOrder: WorkOrderViewModel): boolean {
    return (
      this.matchesSearch(workOrder) &&
      this.matchesStatus(workOrder) &&
      this.matchesType(workOrder)
    );
  }

  private matchesSearch(workOrder: WorkOrderViewModel): boolean {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      workOrder.clientId.toLowerCase().includes(query) ||
      workOrder.vehicleId.toLowerCase().includes(query)
    );
  }

  private matchesStatus(workOrder: WorkOrderViewModel): boolean {
    return this.selectedStatus === 'all' || workOrder.status === this.selectedStatus;
  }

  private matchesType(workOrder: WorkOrderViewModel): boolean {
    return this.selectedType === 'all' || workOrder.type === this.selectedType;
  }
}
