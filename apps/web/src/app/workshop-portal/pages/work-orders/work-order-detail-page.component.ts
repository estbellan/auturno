import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  ApiService,
  AuditHistoryEventViewModel,
  CustomerViewModel,
  DiagnosticViewModel,
  NotificationOutboxItemViewModel,
  QuoteViewModel,
  ServiceViewModel,
  VehicleViewModel,
  WorkOrderViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';
import {
  formatDateTime,
  formatVehicleLabel,
} from '../../../shared/utils/display-formatters';
import { DiagnosticSectionComponent } from './diagnostic-section.component';
import { QuoteSectionComponent } from './quote-section.component';
import { WorkOrderSummarySectionComponent } from './work-order-summary-section.component';

@Component({
  selector: 'at-work-order-detail-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    PageShellComponent,
    WorkOrderSummarySectionComponent,
    DiagnosticSectionComponent,
    QuoteSectionComponent,
  ],
  templateUrl: './work-order-detail-page.component.html',
  styleUrl: './work-order-detail-page.component.scss',
})
export class WorkOrderDetailPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  workOrder: WorkOrderViewModel | null = null;
  diagnostic: DiagnosticViewModel | null = null;
  quote: QuoteViewModel | null = null;
  history: AuditHistoryEventViewModel[] = [];
  notifications: NotificationOutboxItemViewModel[] = [];
  customers: CustomerViewModel[] = [];
  vehicles: VehicleViewModel[] = [];
  services: ServiceViewModel[] = [];
  loading = true;
  error = '';
  actionLoading = '';
  promiseSubmitting = false;
  promiseError = '';
  promiseSuccessMessage = '';
  acknowledgingNotificationId = '';
  notificationError = '';
  promiseForm = {
    promisedDiagnosticAt: '',
    promisedDeliveryAt: '',
    reason: '',
  };
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

  get customerName(): string {
    const workOrder = this.workOrder;
    if (!workOrder) return '';
    return this.customers.find((customer) => customer.id === workOrder.clientId)?.name
      ?? this.i18n.t('agenda.customerMissing');
  }

  get vehicleLabel(): string {
    const workOrder = this.workOrder;
    if (!workOrder) return '';
    return this.describeVehicle(
      this.vehicles.find((vehicle) => vehicle.id === workOrder.vehicleId),
      workOrder.vehicleId,
    );
  }

  get serviceName(): string {
    const workOrder = this.workOrder;
    if (!workOrder) return '';
    return this.services.find((service) => service.id === workOrder.serviceId)?.name
      ?? this.i18n.t('agenda.serviceMissing');
  }

  get availableActions(): Array<{ id: ActionId; label: string }> {
    if (!this.workOrder) return [];

    const actions: Record<string, Array<{ id: ActionId; label: string }>> = {
      scheduled: [{ id: 'start-operation', label: this.i18n.t('workOrders.detail.startOperation') }],
      in_operation: [{ id: 'mark-ready', label: this.i18n.t('workOrders.detail.markReady') }],
      ready: [{ id: 'close', label: this.i18n.t('workOrders.detail.close') }],
      closed: [{ id: 'pick-up', label: this.i18n.t('workOrders.detail.pickUp') }],
    };

    return actions[this.workOrder.status] ?? [];
  }

  get diagnosticActions(): Array<{ id: ActionId; label: string }> {
    return this.diagnostic?.status === 'draft'
      ? [{ id: 'complete-diagnostic', label: this.i18n.t('workOrders.detail.diagnosticComplete') }]
      : [];
  }

  get quoteActions(): Array<{ id: ActionId; label: string; tone?: 'secondary' }> {
    if (this.quote?.status === 'draft') {
      return [{ id: 'send-quote', label: this.i18n.t('workOrders.detail.quoteSend') }];
    }

    if (this.quote?.status === 'sent') {
      return [
        { id: 'approve-quote', label: this.i18n.t('workOrders.detail.quoteApprove') },
        { id: 'reject-quote', label: this.i18n.t('workOrders.detail.quoteReject'), tone: 'secondary' },
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

  get canSavePromises(): boolean {
    if (!this.workOrder) {
      return false;
    }

    return Boolean(this.buildPromisePayload());
  }

  async loadWorkOrder(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const token = await this.authService.getAccessToken();
      const workOrderId = this.route.snapshot.paramMap.get('id');

      if (!token) {
        this.error = this.i18n.t('workOrders.detail.authError');
        return;
      }

      if (!workOrderId) {
        this.error = this.i18n.t('workOrders.detail.missingId');
        return;
      }

      const [workOrder, customers, vehicles, services, history, notifications] = await Promise.all([
        this.apiService.getWorkOrder(token, workOrderId),
        this.apiService.listCustomers(token),
        this.apiService.listVehicles(token),
        this.apiService.listServices(token),
        this.apiService.getWorkOrderHistory(token, workOrderId),
        this.apiService.getWorkOrderNotifications(token, workOrderId),
      ]);

      this.workOrder = workOrder;
      this.customers = customers;
      this.vehicles = vehicles;
      this.services = services;
      this.history = history;
      this.notifications = notifications;
      this.resetPromiseForm();

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
      this.error = this.i18n.t('workOrders.detail.error');
      this.history = [];
      this.notifications = [];
    } finally {
      this.loading = false;
    }
  }

  async createDiagnosticDraft(): Promise<void> {
    if (!this.workOrder) return;

    const payload = this.buildDiagnosticPayload();
    if (!payload) {
      this.error = this.i18n.t('workOrders.detail.diagnosticSummaryRequired');
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
      this.error = this.i18n.t('workOrders.detail.diagnosticCreateError');
    } finally {
      this.actionLoading = '';
    }
  }

  async createQuoteDraft(): Promise<void> {
    if (!this.diagnostic) return;

    const payload = this.buildQuotePayload();
    if (!payload) {
      this.error = this.i18n.t('workOrders.detail.quoteItemRequired');
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
      this.error = this.i18n.t('workOrders.detail.quoteCreateError');
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
        this.error = this.i18n.t('workOrders.detail.actionAuthError');
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
      this.error = this.i18n.t('workOrders.detail.actionError');
    } finally {
      this.actionLoading = '';
    }
  }

  async savePromises(): Promise<void> {
    if (!this.workOrder) return;

    const payload = this.buildPromisePayload();
    if (!payload) {
      this.promiseError = this.i18n.t('workOrders.detail.promisesChangeRequired');
      return;
    }

    this.promiseSubmitting = true;
    this.promiseError = '';
    this.promiseSuccessMessage = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.promiseError = this.i18n.t('workOrders.detail.promisesAuthError');
        return;
      }

      await this.apiService.updateWorkOrderPromises(token, this.workOrder.id, payload);
      this.promiseSuccessMessage = this.i18n.t('workOrders.detail.promisesSaved');
      await this.loadWorkOrder();
    } catch (error) {
      console.error('Failed to update work order promises', error);
      this.promiseError = this.resolvePromiseError(error);
    } finally {
      this.promiseSubmitting = false;
    }
  }

  async acknowledgeNotification(notificationId: string): Promise<void> {
    if (!this.workOrder) {
      return;
    }

    this.acknowledgingNotificationId = notificationId;
    this.notificationError = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.notificationError =
          this.i18n.t('workOrders.detail.communicationAuthError');
        return;
      }

      await this.apiService.acknowledgeWorkOrderNotification(
        token,
        this.workOrder.id,
        notificationId,
      );
      await this.loadWorkOrder();
    } catch (error) {
      console.error('Failed to acknowledge notification', error);
      this.notificationError = this.i18n.t('workOrders.detail.communicationError');
    } finally {
      this.acknowledgingNotificationId = '';
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

  historyLabel(action: AuditHistoryEventViewModel['action']): string {
    const labels: Record<AuditHistoryEventViewModel['action'], string> = {
      work_order_created: this.i18n.t('workOrders.detail.history.work_order_created'),
      work_order_status_changed: this.i18n.t('workOrders.detail.history.work_order_status_changed'),
      work_order_promises_changed: this.i18n.t('workOrders.detail.history.work_order_promises_changed'),
      diagnostic_created: this.i18n.t('workOrders.detail.history.diagnostic_created'),
      diagnostic_completed: this.i18n.t('workOrders.detail.history.diagnostic_completed'),
      quote_created: this.i18n.t('workOrders.detail.history.quote_created'),
      quote_sent: this.i18n.t('workOrders.detail.history.quote_sent'),
      quote_approved: this.i18n.t('workOrders.detail.history.quote_approved'),
      quote_rejected: this.i18n.t('workOrders.detail.history.quote_rejected'),
    };

    return labels[action];
  }

  notificationLabel(
    eventType: NotificationOutboxItemViewModel['eventType'],
  ): string {
    const labels: Record<NotificationOutboxItemViewModel['eventType'], string> = {
      quote_sent: this.i18n.t('workOrders.detail.notification.quote_sent'),
      work_order_promises_changed: this.i18n.t('workOrders.detail.notification.work_order_promises_changed'),
      work_order_status_changed: this.i18n.t('workOrders.detail.notification.work_order_status_changed'),
    };

    return labels[eventType];
  }

  historyReason(event: AuditHistoryEventViewModel): string | null {
    return this.readMetadata(event, 'reason');
  }

  hasChange(
    event: AuditHistoryEventViewModel,
    fromKey: string,
    toKey: string,
  ): boolean {
    return this.readMetadata(event, fromKey) !== this.readMetadata(event, toKey);
  }

  readMetadata(
    event: AuditHistoryEventViewModel,
    key: string,
  ): string | null {
    const value = event.metadata?.[key];
    return typeof value === 'string' ? value : null;
  }

  formatValue(value: string | null): string {
    if (!value) return this.i18n.t('common.notAvailable');
    return this.i18n.t(`workOrders.status.${value}`);
  }

  formatDate(value: string | null): string {
    return formatDateTime(value, this.i18n.t('common.notSetYet'));
  }

  private describeVehicle(
    vehicle: VehicleViewModel | undefined,
    fallbackVehicleId: string,
  ): string {
    return formatVehicleLabel(vehicle, fallbackVehicleId);
  }

  private buildPromisePayload():
    | {
        promisedDiagnosticAt?: string;
        promisedDeliveryAt?: string;
        reason?: string;
      }
    | null {
    if (!this.workOrder) {
      return null;
    }

    const payload: {
      promisedDiagnosticAt?: string;
      promisedDeliveryAt?: string;
      reason?: string;
    } = {};

    const promisedDiagnosticAt = this.normalizeDateTimeLocal(
      this.promiseForm.promisedDiagnosticAt,
    );
    const promisedDeliveryAt = this.normalizeDateTimeLocal(
      this.promiseForm.promisedDeliveryAt,
    );

    if (
      promisedDiagnosticAt !== null &&
      promisedDiagnosticAt !== this.workOrder.promisedDiagnosticAt
    ) {
      payload.promisedDiagnosticAt = promisedDiagnosticAt;
    }

    if (
      promisedDeliveryAt !== null &&
      promisedDeliveryAt !== this.workOrder.promisedDeliveryAt
    ) {
      payload.promisedDeliveryAt = promisedDeliveryAt;
    }

    const normalizedReason = this.promiseForm.reason.trim();
    if (
      (payload.promisedDiagnosticAt !== undefined ||
        payload.promisedDeliveryAt !== undefined) &&
      normalizedReason
    ) {
      payload.reason = normalizedReason;
    }

    return Object.keys(payload).length ? payload : null;
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

  private normalizeDateTimeLocal(value: string): string | null {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    return new Date(normalized).toISOString();
  }

  private formatDateTimeLocal(value: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  }

  private resolvePromiseError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return Array.isArray(error.error.message)
        ? error.error.message.join(', ')
        : error.error.message;
    }

    return this.i18n.t('workOrders.detail.promisesError');
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

  resetPromiseForm(): void {
    this.promiseError = '';
    this.promiseForm = {
      promisedDiagnosticAt: this.formatDateTimeLocal(
        this.workOrder?.promisedDiagnosticAt ?? null,
      ),
      promisedDeliveryAt: this.formatDateTimeLocal(
        this.workOrder?.promisedDeliveryAt ?? null,
      ),
      reason: '',
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
