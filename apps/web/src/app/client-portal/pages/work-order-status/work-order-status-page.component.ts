import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  ApiService,
  WorkOrderTrackingViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-work-order-status-page',
  standalone: true,
  imports: [FormsModule, PageShellComponent],
  templateUrl: './work-order-status-page.component.html',
  styleUrl: './work-order-status-page.component.scss',
})
export class WorkOrderStatusPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  tracking: WorkOrderTrackingViewModel | null = null;
  loading = true;
  error = '';
  quoteSubmitting = false;
  pendingDecision: 'approve' | 'reject' | '' = '';
  quoteComment = '';
  quoteActionError = '';
  quoteActionSuccess = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadTracking();
  }

  get milestones(): Array<{
    id: string;
    label: string;
    description: string;
    state: 'done' | 'current' | 'upcoming';
  }> {
    if (!this.tracking) {
      return [];
    }

    const steps = this.tracking.type === 'diagnostic'
      ? [
          {
            id: 'reception',
            label: this.i18n.t('tracking.step.reception.label'),
            description: this.i18n.t('tracking.step.reception.desc'),
            statuses: ['reception', 'in_diagnosis', 'quote_sent', 'awaiting_approval', 'in_operation', 'ready', 'closed', 'picked_up'],
          },
          {
            id: 'in_diagnosis',
            label: this.i18n.t('tracking.step.inDiagnosis.label'),
            description: this.i18n.t('tracking.step.inDiagnosis.desc'),
            statuses: ['in_diagnosis', 'quote_sent', 'awaiting_approval', 'in_operation', 'ready', 'closed', 'picked_up'],
          },
          {
            id: 'quote_sent',
            label: this.i18n.t('tracking.step.quoteSent.label'),
            description: this.i18n.t('tracking.step.quoteSent.desc'),
            statuses: ['quote_sent', 'awaiting_approval', 'in_operation', 'ready', 'closed', 'picked_up'],
          },
          {
            id: 'in_operation',
            label: this.i18n.t('tracking.step.inOperation.label'),
            description: this.i18n.t('tracking.step.inOperation.desc'),
            statuses: ['in_operation', 'ready', 'closed', 'picked_up'],
          },
          {
            id: 'ready',
            label: this.i18n.t('tracking.step.ready.label'),
            description: this.i18n.t('tracking.step.ready.desc'),
            statuses: ['ready', 'closed', 'picked_up'],
          },
        ]
      : [
          {
            id: 'scheduled',
            label: this.i18n.t('tracking.step.scheduled.label'),
            description: this.i18n.t('tracking.step.scheduled.desc'),
            statuses: ['scheduled', 'in_operation', 'ready', 'closed', 'picked_up'],
          },
          {
            id: 'in_operation',
            label: this.i18n.t('tracking.step.inOperation.label'),
            description: this.i18n.t('tracking.step.directInOperation.desc'),
            statuses: ['in_operation', 'ready', 'closed', 'picked_up'],
          },
          {
            id: 'ready',
            label: this.i18n.t('tracking.step.ready.label'),
            description: this.i18n.t('tracking.step.directReady.desc'),
            statuses: ['ready', 'closed', 'picked_up'],
          },
        ];

    const currentIndex = steps.findIndex((step) =>
      step.statuses.includes(this.tracking!.currentStatus),
    );

    return steps.map((step, index) => ({
      id: step.id,
      label: step.label,
      description: step.description,
      state:
        index < currentIndex
          ? 'done'
          : index === currentIndex
            ? 'current'
            : 'upcoming',
    }));
  }

  async loadTracking(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const token = await this.authService.getAccessToken();
      const workOrderId = this.route.snapshot.paramMap.get('id');

      if (!workOrderId) {
        this.tracking = null;
        return;
      }

      if (!token) {
        this.error = this.i18n.t('tracking.authError');
        return;
      }

      this.tracking = await this.apiService.getClientWorkOrderTracking(token, workOrderId);
    } catch (error) {
      console.error('Failed to load client work order tracking', error);
      this.error = this.i18n.t('tracking.error');
    } finally {
      this.loading = false;
    }
  }

  async submitQuoteDecision(
    decision: 'approve' | 'reject' = 'approve',
  ): Promise<void> {
    if (!this.tracking?.quoteId) {
      return;
    }

    this.quoteSubmitting = true;
    this.pendingDecision = decision;
    this.quoteActionError = '';
    this.quoteActionSuccess = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.quoteActionError = this.i18n.t('tracking.decisionAuthError');
        return;
      }

      await this.apiService.submitCustomerQuoteResponse(token, this.tracking.quoteId, {
        decision,
        comment: this.optionalComment(this.quoteComment),
      });

      this.quoteComment = '';
      this.quoteActionSuccess =
        decision === 'approve'
          ? this.i18n.t('tracking.approveSuccess')
          : this.i18n.t('tracking.rejectSuccess');
      await this.loadTracking();
    } catch (error) {
      console.error('Failed to submit customer quote response', error);
      this.quoteActionError = this.i18n.t('tracking.decisionError');
    } finally {
      this.quoteSubmitting = false;
      this.pendingDecision = '';
    }
  }

  formatDate(value: string | null): string {
    return value ? new Date(value).toLocaleString() : this.i18n.t('tracking.notAvailable');
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatQuoteStatus(status: string): string {
    const labels: Record<string, string> = {
      draft: this.i18n.t('tracking.quote.draft'),
      sent: this.i18n.t('tracking.quote.sent'),
      approved: this.i18n.t('tracking.quote.approved'),
      rejected: this.i18n.t('tracking.quote.rejected'),
    };

    return labels[status] ?? status;
  }

  milestoneStateLabel(state: 'done' | 'current' | 'upcoming'): string {
    const labels: Record<string, string> = {
      done: this.i18n.t('tracking.milestone.done'),
      current: this.i18n.t('tracking.milestone.current'),
      upcoming: this.i18n.t('tracking.milestone.upcoming'),
    };

    return labels[state];
  }

  private optionalComment(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }
}
