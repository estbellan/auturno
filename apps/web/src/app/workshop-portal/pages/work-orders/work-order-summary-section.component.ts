import { Component, EventEmitter, Input, Output, inject } from '@angular/core';

import { WorkOrderViewModel } from '../../../core/api.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { formatDateTime } from '../../../shared/utils/display-formatters';

@Component({
  selector: 'at-work-order-summary-section',
  standalone: true,
  templateUrl: './work-order-summary-section.component.html',
  styleUrl: './work-order-summary-section.component.scss',
})
export class WorkOrderSummarySectionComponent {
  readonly i18n = inject(I18nService);
  @Input({ required: true }) workOrder!: WorkOrderViewModel;
  @Input({ required: true }) customerName!: string;
  @Input({ required: true }) vehicleLabel!: string;
  @Input({ required: true }) serviceName!: string;
  @Input({ required: true }) actions!: Array<{ id: string; label: string }>;
  @Input({ required: true }) actionLoading!: string;
  @Output() readonly actionSelected = new EventEmitter<string>();

  formatStatus(status: string): string {
    return this.i18n.t(`workOrders.status.${status}`);
  }

  formatDate(value: string | null): string {
    return formatDateTime(value);
  }
}
