import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  ApiService,
  DiagnosticViewModel,
  QuoteViewModel,
  WorkOrderViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';
import { DiagnosticSectionComponent } from './diagnostic-section.component';
import { QuoteSectionComponent } from './quote-section.component';
import { WorkOrderSummarySectionComponent } from './work-order-summary-section.component';

@Component({
  selector: 'at-work-order-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    PageShellComponent,
    WorkOrderSummarySectionComponent,
    DiagnosticSectionComponent,
    QuoteSectionComponent,
  ],
  template: `
    <section class="detail-page">
      <a class="back-link" routerLink="/workshop/work-orders">Back to work orders</a>
      <at-page-shell
        title="Work Order Detail"
        description="Review the current backend-driven work order state, diagnostics, quotes, and trigger allowed actions."
      />

      @if (loading) {
        <section class="card status-card">Loading work order...</section>
      } @else if (error) {
        <section class="card status-card error">{{ error }}</section>
      } @else if (workOrder) {
        <at-work-order-summary-section
          [workOrder]="workOrder"
          [actions]="availableActions"
          [actionLoading]="actionLoading"
          (actionSelected)="runAction($event)"
        />

        @if (workOrder.type === 'diagnostic') {
          <at-diagnostic-section
            [diagnostic]="diagnostic"
            [actions]="diagnosticActions"
            [actionLoading]="actionLoading"
            [form]="diagnosticForm"
            [canCreateDiagnostic]="canCreateDiagnostic"
            (actionSelected)="runAction($event)"
            (createDraft)="createDiagnosticDraft()"
            (addRecommendedService)="addRecommendedService()"
            (removeRecommendedService)="removeRecommendedService($event)"
          />

          <at-quote-section
            [quote]="quote"
            [actions]="quoteActions"
            [actionLoading]="actionLoading"
            [showForm]="showQuoteForm"
            [canCreateQuote]="canCreateQuote"
            [draftTotal]="quoteDraftTotal"
            [form]="quoteForm"
            (actionSelected)="runAction($event)"
            (createDraft)="createQuoteDraft()"
            (addItem)="addQuoteItem()"
            (removeItem)="removeQuoteItem($event)"
          />
        }
      }
    </section>
  `,
  styles: [
    `
      .detail-page { display: grid; gap: 1rem; }
      .back-link { color: #1d4ed8; text-decoration: none; font-weight: 600; }
      .card { border-radius: 16px; background: #fff; border: 1px solid #dbe4f0; box-shadow: 0 10px 30px rgba(15,23,42,.06); }
      .status-card { padding: 1rem; }
      .error { color: #991b1b; background: #fef2f2; border-color: #fecaca; }
    `,
  ],
})
export class WorkOrderDetailPageComponent implements OnInit {
  workOrder: WorkOrderViewModel | null = null;
  diagnostic: DiagnosticViewModel | null = null;
  quote: QuoteViewModel | null = null;
  loading = true;
  error = '';
  actionLoading = '';
  diagnosticForm = {
    summary: '',
    notes: '',
    estimatedOperationHours: null as number | null,
    recommendedServices: [''],
  };
  quoteForm = {
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadWorkOrder();
  }

  get availableActions(): Array<{ id: ActionId; label: string }> {
    if (!this.workOrder) return [];

    const actions: Record<string, Array<{ id: ActionId; label: string }>> = {
      scheduled: [{ id: 'start-operation', label: 'Start operation' }],
      in_operation: [{ id: 'mark-ready', label: 'Mark ready' }],
      ready: [{ id: 'close', label: 'Close work order' }],
      closed: [{ id: 'pick-up', label: 'Mark picked up' }],
    };

    return actions[this.workOrder.status] ?? [];
  }

  get diagnosticActions(): Array<{ id: ActionId; label: string }> {
    return this.diagnostic?.status === 'draft'
      ? [{ id: 'complete-diagnostic', label: 'Complete diagnostic' }]
      : [];
  }

  get quoteActions(): Array<{ id: ActionId; label: string; tone?: 'secondary' }> {
    if (this.quote?.status === 'draft') {
      return [{ id: 'send-quote', label: 'Send quote' }];
    }

    if (this.quote?.status === 'sent') {
      return [
        { id: 'approve-quote', label: 'Approve quote' },
        { id: 'reject-quote', label: 'Reject quote', tone: 'secondary' },
      ];
    }

    return [];
  }

  get showQuoteForm(): boolean {
    return (
      this.workOrder?.type === 'diagnostic' &&
      this.diagnostic?.status === 'completed' &&
      !this.quote
    );
  }

  get canCreateDiagnostic(): boolean {
    return this.diagnosticForm.summary.trim().length > 0;
  }

  get canCreateQuote(): boolean {
    return this.quoteForm.items.some((item) => this.isValidQuoteItem(item));
  }

  get quoteDraftTotal(): number {
    return this.quoteForm.items.reduce((sum, item) => sum + this.getLineTotal(item), 0);
  }

  async loadWorkOrder(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const token = await this.authService.getAccessToken();
      const workOrderId = this.route.snapshot.paramMap.get('id');

      if (!token) {
        this.error = 'Unable to load work order without an authenticated session.';
        return;
      }

      if (!workOrderId) {
        this.error = 'Work order id is missing from the route.';
        return;
      }

      this.workOrder = await this.apiService.getWorkOrder(token, workOrderId);

      if (this.workOrder.type === 'diagnostic') {
        const [diagnosticResult, quoteResult] = await Promise.allSettled([
          this.apiService.getDiagnosticByWorkOrder(token, workOrderId),
          this.apiService.getQuoteByWorkOrder(token, workOrderId),
        ]);

        this.diagnostic = this.resolveOptional(diagnosticResult);
        this.quote = this.resolveOptional(quoteResult);

        if (!this.diagnostic) {
          this.resetDiagnosticForm();
        }

        if (!this.quote) {
          this.resetQuoteForm();
        }
      } else {
        this.diagnostic = null;
        this.quote = null;
      }
    } catch (error) {
      console.error('Failed to load work order', error);
      this.error = 'Failed to load work order detail from the backend.';
    } finally {
      this.loading = false;
    }
  }

  async createDiagnosticDraft(): Promise<void> {
    if (!this.workOrder) return;

    const payload = this.buildDiagnosticPayload();
    if (!payload) {
      this.error = 'Enter a diagnostic summary before creating the draft.';
      return;
    }

    this.actionLoading = 'create-diagnostic';
    this.error = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) return;

      await this.apiService.createDiagnosticDraft(token, this.workOrder.id, payload);
      await this.loadWorkOrder();
    } catch (error) {
      console.error('Failed to create diagnostic draft', error);
      this.error = 'Failed to create diagnostic draft.';
    } finally {
      this.actionLoading = '';
    }
  }

  async createQuoteDraft(): Promise<void> {
    if (!this.diagnostic) return;

    const payload = this.buildQuotePayload();
    if (!payload) {
      this.error = 'Add at least one valid quote item before creating the draft.';
      return;
    }

    this.actionLoading = 'create-quote';
    this.error = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) return;

      await this.apiService.createQuote(token, this.diagnostic.id, payload);
      await this.loadWorkOrder();
    } catch (error) {
      console.error('Failed to create quote draft', error);
      this.error = 'Failed to create quote draft.';
    } finally {
      this.actionLoading = '';
    }
  }

  async runAction(action: string): Promise<void> {
    if (!this.workOrder) return;

    const nextAction = action as ActionId;
    this.actionLoading = nextAction;
    this.error = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = 'Unable to run action without an authenticated session.';
        return;
      }

      const actions: Record<ActionId, () => Promise<unknown>> = {
        'start-operation': () => this.apiService.startOperation(token, this.workOrder!.id),
        'mark-ready': () => this.apiService.markWorkOrderReady(token, this.workOrder!.id),
        close: () => this.apiService.closeWorkOrder(token, this.workOrder!.id),
        'pick-up': () => this.apiService.pickUpWorkOrder(token, this.workOrder!.id),
        'complete-diagnostic': () => this.apiService.completeDiagnostic(token, this.diagnostic!.id),
        'send-quote': () => this.apiService.sendQuote(token, this.quote!.id),
        'approve-quote': () => this.apiService.approveQuote(token, this.quote!.id),
        'reject-quote': () => this.apiService.rejectQuote(token, this.quote!.id),
        'create-diagnostic': async () => undefined,
        'create-quote': async () => undefined,
      };

      await actions[nextAction]();
      await this.loadWorkOrder();
    } catch (error) {
      console.error('Failed to run work order action', error);
      this.error = 'Failed to update work order status.';
    } finally {
      this.actionLoading = '';
    }
  }

  addRecommendedService(): void {
    this.diagnosticForm.recommendedServices.push('');
  }

  removeRecommendedService(index: number): void {
    if (this.diagnosticForm.recommendedServices.length === 1) {
      this.diagnosticForm.recommendedServices[0] = '';
      return;
    }

    this.diagnosticForm.recommendedServices.splice(index, 1);
  }

  addQuoteItem(): void {
    this.quoteForm.items.push({ description: '', quantity: 1, unitPrice: 0 });
  }

  removeQuoteItem(index: number): void {
    if (this.quoteForm.items.length === 1) {
      this.quoteForm.items[0] = { description: '', quantity: 1, unitPrice: 0 };
      return;
    }

    this.quoteForm.items.splice(index, 1);
  }

  private resolveOptional<T>(result: PromiseSettledResult<T>): T | null {
    if (result.status === 'fulfilled') return result.value;
    if (result.reason instanceof HttpErrorResponse && result.reason.status === 404) return null;
    throw result.reason;
  }

  private buildDiagnosticPayload() {
    const summary = this.diagnosticForm.summary.trim();
    if (!summary) return null;

    const notes = this.diagnosticForm.notes.trim();
    const estimatedOperationHours = this.normalizeNumber(this.diagnosticForm.estimatedOperationHours);

    return {
      summary,
      notes: notes || undefined,
      estimatedOperationHours: estimatedOperationHours ?? undefined,
      recommendedServices: this.diagnosticForm.recommendedServices
        .map((item) => item.trim())
        .filter(Boolean),
    };
  }

  private buildQuotePayload() {
    const items = this.quoteForm.items
      .map((item) => ({
        description: item.description.trim(),
        quantity: this.normalizeNumber(item.quantity),
        unitPrice: this.normalizeNumber(item.unitPrice),
      }))
      .filter(
        (item) =>
          item.description &&
          item.quantity !== null &&
          item.quantity >= 1 &&
          item.unitPrice !== null &&
          item.unitPrice >= 0,
      )
      .map((item) => ({
        description: item.description,
        quantity: item.quantity as number,
        unitPrice: item.unitPrice as number,
      }));

    return items.length ? { items } : null;
  }

  private isValidQuoteItem(item: {
    description: string;
    quantity: number | null;
    unitPrice: number | null;
  }): boolean {
    const quantity = this.normalizeNumber(item.quantity);
    const unitPrice = this.normalizeNumber(item.unitPrice);

    return (
      item.description.trim().length > 0 &&
      quantity !== null &&
      quantity >= 1 &&
      unitPrice !== null &&
      unitPrice >= 0
    );
  }

  private getLineTotal(item: {
    quantity: number | null;
    unitPrice: number | null;
  }): number {
    return (this.normalizeNumber(item.quantity) ?? 0) * (this.normalizeNumber(item.unitPrice) ?? 0);
  }

  private normalizeNumber(value: number | null): number | null {
    return value === null || value === undefined || Number.isNaN(value) ? null : Number(value);
  }

  private resetDiagnosticForm(): void {
    this.diagnosticForm = {
      summary: '',
      notes: '',
      estimatedOperationHours: null,
      recommendedServices: [''],
    };
  }

  private resetQuoteForm(): void {
    this.quoteForm = {
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    };
  }
}

type ActionId =
  | 'start-operation'
  | 'mark-ready'
  | 'close'
  | 'pick-up'
  | 'create-diagnostic'
  | 'complete-diagnostic'
  | 'create-quote'
  | 'send-quote'
  | 'approve-quote'
  | 'reject-quote';
