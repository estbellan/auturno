import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuoteViewModel } from '../../../core/api.service';

@Component({
  selector: 'at-quote-section',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card detail-card">
      <div class="header-row section-header">
        <h3>Quote</h3>
        @if (actions.length) {
          <div class="action-grid compact">
            @for (action of actions; track action.id) {
              <button
                type="button"
                [class.secondary]="action.tone === 'secondary'"
                [disabled]="actionLoading === action.id"
                (click)="actionSelected.emit(action.id)"
              >
                {{ actionLoading === action.id ? 'Working...' : action.label }}
              </button>
            }
          </div>
        }
      </div>

      @if (quote) {
        <dl class="detail-grid">
          <div><dt>Status</dt><dd>{{ formatStatus(quote.status) }}</dd></div>
          <div><dt>Subtotal</dt><dd>{{ formatAmount(quote.subtotal) }}</dd></div>
          <div><dt>Total</dt><dd>{{ formatAmount(quote.total) }}</dd></div>
          <div><dt>Sent at</dt><dd>{{ formatDate(quote.sentAt) }}</dd></div>
          <div><dt>Responded at</dt><dd>{{ formatDate(quote.respondedAt) }}</dd></div>
        </dl>

        <div class="quote-items">
          @for (item of quote.items; track item.description + '-' + item.total) {
            <div class="quote-item">
              <div>
                <strong>{{ item.description }}</strong>
                <p>Qty {{ item.quantity }} x {{ formatAmount(item.unitPrice) }}</p>
              </div>
              <span>{{ formatAmount(item.total) }}</span>
            </div>
          }
        </div>
      } @else {
        <p class="empty-copy">No quote is available for this work order yet.</p>

        @if (showForm) {
          <form class="editor-form" (ngSubmit)="createDraft.emit()">
            <div class="inline-header">
              <dt>Quote items</dt>
              <button type="button" class="secondary" (click)="addItem.emit()">Add item</button>
            </div>

            <div class="editor-list">
              @for (item of form.items; track $index; let index = $index) {
                <div class="quote-editor-card">
                  <label class="field">
                    <span>Description</span>
                    <input type="text" [name]="'description' + index" [(ngModel)]="form.items[index].description" required />
                  </label>

                  <div class="detail-grid">
                    <label class="field">
                      <span>Quantity</span>
                      <input type="number" [name]="'quantity' + index" [(ngModel)]="form.items[index].quantity" min="1" step="1" required />
                    </label>
                    <label class="field">
                      <span>Unit price</span>
                      <input type="number" [name]="'unitPrice' + index" [(ngModel)]="form.items[index].unitPrice" min="0" step="0.01" required />
                    </label>
                  </div>

                  <div class="inline-header">
                    <span>Line total: {{ getLineTotal(index) }}</span>
                    <button type="button" class="secondary" (click)="removeItem.emit(index)" [disabled]="form.items.length === 1">
                      Remove
                    </button>
                  </div>
                </div>
              }
            </div>

            <div class="totals-box">
              <span>Draft total</span>
              <strong>{{ formatAmount(draftTotal) }}</strong>
            </div>

            <button type="submit" [disabled]="actionLoading === 'create-quote' || !canCreateQuote">
              {{ actionLoading === 'create-quote' ? 'Working...' : 'Create quote draft' }}
            </button>
          </form>
        }
      }
    </section>
  `,
  styles: [
    `
      .card { border-radius: 16px; background: #fff; border: 1px solid #dbe4f0; box-shadow: 0 10px 30px rgba(15,23,42,.06); }
      .detail-card { padding: 1rem; }
      .header-row, .inline-header { display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; flex-wrap: wrap; }
      .section-header { margin-bottom: .75rem; }
      h3, dt, dd, p { margin: 0; }
      .detail-grid, .action-grid, .editor-form, .editor-list, .quote-items { display: grid; gap: .8rem; }
      .detail-grid, .action-grid { grid-template-columns: 1fr; }
      .action-grid.compact { width: 100%; }
      dt { color: #64748b; font-size: .8rem; font-weight: 600; margin-bottom: .2rem; }
      dd { color: #0f172a; font-weight: 600; }
      .field { display: grid; gap: .4rem; }
      .field span { color: #334155; font-size: .85rem; font-weight: 600; }
      input, button { font: inherit; }
      input { width: 100%; padding: .8rem .9rem; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; color: #0f172a; }
      .quote-item, .quote-editor-card, .totals-box { border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; }
      .quote-item { display: flex; justify-content: space-between; gap: .75rem; padding: .85rem; }
      .quote-item p { margin-top: .25rem; color: #64748b; }
      .quote-editor-card { padding: .9rem; display: grid; gap: .8rem; }
      .totals-box { padding: .9rem 1rem; display: flex; justify-content: space-between; align-items: center; }
      .empty-copy { color: #64748b; margin-top: .75rem; }
      .secondary { background: #334155; }
      button[disabled] { opacity: .7; }
      @media (min-width: 768px) {
        .detail-grid, .action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .action-grid.compact { width: auto; grid-template-columns: repeat(2, minmax(0, max-content)); }
      }
    `,
  ],
})
export class QuoteSectionComponent {
  @Input({ required: true }) quote!: QuoteViewModel | null;
  @Input({ required: true }) actions!: Array<{ id: string; label: string; tone?: 'secondary' }>;
  @Input({ required: true }) actionLoading!: string;
  @Input({ required: true }) showForm!: boolean;
  @Input({ required: true }) canCreateQuote!: boolean;
  @Input({ required: true }) draftTotal!: number;
  @Input({ required: true }) form!: {
    items: Array<{ description: string; quantity: number | null; unitPrice: number | null }>;
  };
  @Output() readonly actionSelected = new EventEmitter<string>();
  @Output() readonly createDraft = new EventEmitter<void>();
  @Output() readonly addItem = new EventEmitter<void>();
  @Output() readonly removeItem = new EventEmitter<number>();

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatDate(value: string | null): string {
    return value ? new Date(value).toLocaleString() : 'Not set';
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  getLineTotal(index: number): string {
    const item = this.form.items[index];
    const quantity = Number(item?.quantity ?? 0);
    const unitPrice = Number(item?.unitPrice ?? 0);
    return this.formatAmount(quantity * unitPrice);
  }
}
