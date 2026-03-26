import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DiagnosticViewModel } from '../../../core/api.service';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'at-diagnostic-section',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './diagnostic-section.component.html',
  styleUrl: './diagnostic-section.component.scss',
})
export class DiagnosticSectionComponent {
  readonly i18n = inject(I18nService);
  @Input({ required: true }) diagnostic!: DiagnosticViewModel | null;
  @Input({ required: true }) actions!: Array<{ id: string; label: string }>;
  @Input({ required: true }) actionLoading!: string;
  @Input({ required: true }) form!: {
    summary: string;
    notes: string;
    estimatedOperationHours: number | null;
    recommendedServices: string[];
  };
  @Input({ required: true }) canCreateDiagnostic!: boolean;
  @Output() readonly actionSelected = new EventEmitter<string>();
  @Output() readonly createDraft = new EventEmitter<void>();
  @Output() readonly addRecommendedService = new EventEmitter<void>();
  @Output() readonly removeRecommendedService = new EventEmitter<number>();

  formatStatus(status: string): string {
    return this.i18n.t(`workOrders.status.${status}`);
  }
}
