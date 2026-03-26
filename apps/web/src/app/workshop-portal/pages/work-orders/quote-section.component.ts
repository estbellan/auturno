import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { QuoteViewModel } from '../../../core/api.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { formatDateTime } from '../../../shared/utils/display-formatters';

@Component({
  selector: 'at-quote-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './quote-section.component.html',
  styleUrl: './quote-section.component.scss',
})
export class QuoteSectionComponent {
  readonly i18n = inject(I18nService);
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
    return this.i18n.t(`workOrders.status.${status}`);
  }

  formatDate(value: string | null): string {
    return formatDateTime(value);
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
