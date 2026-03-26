import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ApiService,
  CustomerViewModel,
  ServiceViewModel,
  VehicleViewModel,
  WorkOrderViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ContextHintComponent } from '../../../shared/components/context-hint/context-hint.component';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';
import {
  formatDateTime,
  formatVehicleLabel,
} from '../../../shared/utils/display-formatters';

type WorkOrderStatus = WorkOrderViewModel['status'];
type WorkOrderType = WorkOrderViewModel['type'];

interface WorkOrderListItemViewModel {
  workOrder: WorkOrderViewModel;
  customerName: string;
  vehicleLabel: string;
  serviceName: string;
}

@Component({
  selector: 'at-work-orders-page',
  standalone: true,
  imports: [FormsModule, RouterLink, PageShellComponent, ContextHintComponent],
  templateUrl: './work-orders-page.component.html',
  styleUrl: './work-orders-page.component.scss',
})
export class WorkOrdersPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  workOrderItems: WorkOrderListItemViewModel[] = [];
  searchTerm = '';
  selectedStatus: WorkOrderStatus | 'all' = 'all';
  selectedType: WorkOrderType | 'all' = 'all';
  loading = true;
  error = '';

  readonly statusOptions: Array<{ value: WorkOrderStatus | 'all'; label: string }> = [
    { value: 'all', label: '' },
    { value: 'scheduled', label: '' },
    { value: 'reception', label: '' },
    { value: 'in_diagnosis', label: '' },
    { value: 'quote_sent', label: '' },
    { value: 'awaiting_approval', label: '' },
    { value: 'in_operation', label: '' },
    { value: 'ready', label: '' },
    { value: 'closed', label: '' },
    { value: 'picked_up', label: '' },
  ];

  readonly typeOptions: Array<{ value: WorkOrderType | 'all'; label: string }> = [
    { value: 'all', label: '' },
    { value: 'direct', label: '' },
    { value: 'diagnostic', label: '' },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly apiService: ApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.initializeOptionLabels();
    await this.loadWorkOrders();
  }

  get filteredWorkOrderItems(): WorkOrderListItemViewModel[] {
    return this.workOrderItems.filter((item) => this.matchesFilters(item));
  }

  get totalCount(): number {
    return this.workOrderItems.length;
  }

  get visibleCount(): number {
    return this.filteredWorkOrderItems.length;
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
        this.error = this.i18n.t('workOrders.authError');
        return;
      }

      const [workOrders, customers, vehicles, services] = await Promise.all([
        this.apiService.listWorkOrders(token),
        this.apiService.listCustomers(token),
        this.apiService.listVehicles(token),
        this.apiService.listServices(token),
      ]);

      this.workOrderItems = this.buildWorkOrderItems(
        workOrders,
        customers,
        vehicles,
        services,
      );
    } catch (error) {
      console.error('Failed to load work orders', error);
      this.error = this.i18n.t('workOrders.error');
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
    return this.i18n.t(`workOrders.status.${status}`);
  }

  formatDate(value: string | null): string {
    return formatDateTime(value);
  }

  statusClassName(status: WorkOrderStatus): string {
    return `status-${status.replace(/_/g, '-')}`;
  }

  private buildWorkOrderItems(
    workOrders: WorkOrderViewModel[],
    customers: CustomerViewModel[],
    vehicles: VehicleViewModel[],
    services: ServiceViewModel[],
  ): WorkOrderListItemViewModel[] {
    const customerMap = new Map(customers.map((customer) => [customer.id, customer]));
    const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
    const serviceMap = new Map(services.map((service) => [service.id, service]));

    return workOrders.map((workOrder) => ({
      workOrder,
      customerName:
        customerMap.get(workOrder.clientId)?.name ?? workOrder.clientId,
      vehicleLabel: formatVehicleLabel(
        vehicleMap.get(workOrder.vehicleId),
        workOrder.vehicleId,
      ),
      serviceName:
        serviceMap.get(workOrder.serviceId)?.name ?? workOrder.serviceId,
    }));
  }

  private matchesFilters(item: WorkOrderListItemViewModel): boolean {
    return (
      this.matchesSearch(item) &&
      this.matchesStatus(item.workOrder) &&
      this.matchesType(item.workOrder)
    );
  }

  private matchesSearch(item: WorkOrderListItemViewModel): boolean {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      item.customerName.toLowerCase().includes(query) ||
      item.vehicleLabel.toLowerCase().includes(query) ||
      item.serviceName.toLowerCase().includes(query)
    );
  }

  private matchesStatus(workOrder: WorkOrderViewModel): boolean {
    return this.selectedStatus === 'all' || workOrder.status === this.selectedStatus;
  }

  private matchesType(workOrder: WorkOrderViewModel): boolean {
    return this.selectedType === 'all' || workOrder.type === this.selectedType;
  }

  private initializeOptionLabels(): void {
    this.statusOptions[0].label = this.i18n.t('workOrders.status.all');
    this.typeOptions[0].label = this.i18n.t('workOrders.type.all');

    for (const option of this.statusOptions.slice(1)) {
      option.label = this.i18n.t(`workOrders.status.${option.value}`);
    }

    this.typeOptions[1].label = this.i18n.t('workOrders.type.direct');
    this.typeOptions[2].label = this.i18n.t('workOrders.type.diagnostic');
  }
}
