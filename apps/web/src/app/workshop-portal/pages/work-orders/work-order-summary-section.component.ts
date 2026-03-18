import { Component, EventEmitter, Input, Output } from '@angular/core';

import { WorkOrderViewModel } from '../../../core/api.service';

@Component({
  selector: 'at-work-order-summary-section',
  standalone: true,
  template: `
    <section class="card detail-card">
      <div class="header-row">
        <div>
          <p class="eyebrow">{{ workOrder.type }} work order</p>
          <h2>{{ formatStatus(workOrder.status) }}</h2>
        </div>
        <span class="status-pill">{{ workOrder.id }}</span>
      </div>

      <dl class="detail-grid">
        <div><dt>Client</dt><dd>{{ workOrder.clientId }}</dd></div>
        <div><dt>Vehicle</dt><dd>{{ workOrder.vehicleId }}</dd></div>
        <div><dt>Diagnostic ETA</dt><dd>{{ formatDate(workOrder.promisedDiagnosticAt) }}</dd></div>
        <div><dt>Delivery ETA</dt><dd>{{ formatDate(workOrder.promisedDeliveryAt) }}</dd></div>
      </dl>
    </section>

    @if (actions.length) {
      <section class="card detail-card">
        <h3>Available work-order actions</h3>
        <div class="action-grid">
          @for (action of actions; track action.id) {
            <button type="button" [disabled]="actionLoading === action.id" (click)="actionSelected.emit(action.id)">
              {{ actionLoading === action.id ? 'Working...' : action.label }}
            </button>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      .card { border-radius: 16px; background: #fff; border: 1px solid #dbe4f0; box-shadow: 0 10px 30px rgba(15,23,42,.06); }
      .detail-card { padding: 1rem; }
      .header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
      .eyebrow { margin: 0 0 .35rem; text-transform: uppercase; font-size: .75rem; font-weight: 700; color: #64748b; letter-spacing: .08em; }
      h2, h3, dt, dd { margin: 0; }
      .status-pill { display: inline-flex; align-items: center; padding: .4rem .7rem; border-radius: 999px; background: #e2e8f0; color: #334155; font-size: .75rem; font-weight: 700; }
      .detail-grid, .action-grid { display: grid; gap: .8rem; grid-template-columns: 1fr; }
      dt { color: #64748b; font-size: .8rem; font-weight: 600; margin-bottom: .2rem; }
      dd { color: #0f172a; font-weight: 600; }
      button { font: inherit; }
      button[disabled] { opacity: .7; }
      @media (min-width: 768px) { .detail-grid, .action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    `,
  ],
})
export class WorkOrderSummarySectionComponent {
  @Input({ required: true }) workOrder!: WorkOrderViewModel;
  @Input({ required: true }) actions!: Array<{ id: string; label: string }>;
  @Input({ required: true }) actionLoading!: string;
  @Output() readonly actionSelected = new EventEmitter<string>();

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatDate(value: string | null): string {
    return value ? new Date(value).toLocaleString() : 'Not set';
  }
}
