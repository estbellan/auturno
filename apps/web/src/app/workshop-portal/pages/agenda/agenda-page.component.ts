import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  ApiService,
  AppointmentViewModel,
  CustomerViewModel,
  ServiceRequestViewModel,
  ServiceViewModel,
  VehicleViewModel,
  WorkOrderViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ContextHintComponent } from '../../../shared/components/context-hint/context-hint.component';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

interface AgendaItemViewModel {
  appointment: AppointmentViewModel;
  customerName: string;
  customerNote: string;
  vehicleLabel: string;
  vehicleNote: string;
  serviceLabel: string;
  serviceNote: string;
  workOrder: WorkOrderViewModel | null;
}

interface ServiceRequestListItemViewModel {
  request: ServiceRequestViewModel;
  customerName: string;
  vehicleLabel: string;
  serviceLabel: string;
}

@Component({
  selector: 'at-agenda-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageShellComponent, ContextHintComponent],
  templateUrl: './agenda-page.component.html',
  styleUrl: './agenda-page.component.scss',
})
export class AgendaPageComponent implements OnInit {
  readonly i18n = inject(I18nService);
  agendaItems: AgendaItemViewModel[] = [];
  serviceRequestItems: ServiceRequestListItemViewModel[] = [];
  loading = true;
  openingAppointmentId: string | null = null;
  updatingServiceRequestId: string | null = null;
  convertingServiceRequestId: string | null = null;
  error = '';
  serviceRequestError = '';

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadAgenda();
  }

  async loadAgenda(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.serviceRequestError = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = this.i18n.t('agenda.authError');
        return;
      }

      const [appointments, customers, vehicles, services, workOrders] =
        await Promise.all([
          this.apiService.listAppointments(token),
          this.apiService.listCustomers(token),
          this.apiService.listVehicles(token),
          this.apiService.listServices(token),
          this.apiService.listWorkOrders(token),
        ]);

      this.agendaItems = this.buildAgendaItems(
        appointments,
        customers,
        vehicles,
        services,
        workOrders,
      );

      try {
        this.serviceRequestItems = this.buildServiceRequestItems(
          await this.apiService.listWorkshopServiceRequests(token),
          customers,
          vehicles,
          services,
        );
      } catch (error) {
        console.error('Failed to load workshop service requests', error);
        this.serviceRequestItems = [];
        this.serviceRequestError = this.i18n.t('agenda.requests.updateError');
      }
    } catch (error) {
      console.error('Failed to load agenda', error);
      this.error = this.i18n.t('agenda.error');
      this.serviceRequestItems = [];
    } finally {
      this.loading = false;
    }
  }

  async openWorkOrder(appointmentId: string): Promise<void> {
    this.openingAppointmentId = appointmentId;
    this.error = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = this.i18n.t('agenda.openAuthError');
        return;
      }

      const workOrder = await this.apiService.createWorkOrderFromAppointment(
        token,
        appointmentId,
      );

      await this.router.navigate(['/workshop/work-orders', workOrder.id]);
    } catch (error) {
      console.error('Failed to open work order from agenda', error);
      this.error = this.i18n.t('agenda.openError');
    } finally {
      this.openingAppointmentId = null;
    }
  }

  async updateServiceRequestStatus(
    serviceRequestId: string,
    status: 'reviewed' | 'accepted' | 'rejected',
  ): Promise<void> {
    this.updatingServiceRequestId = serviceRequestId;
    this.serviceRequestError = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.serviceRequestError = this.i18n.t('agenda.requests.updateAuthError');
        return;
      }

      await this.apiService.updateWorkshopServiceRequestStatus(
        token,
        serviceRequestId,
        status,
      );
      await this.loadAgenda();
    } catch (error) {
      console.error('Failed to update service request', error);
      this.serviceRequestError = this.i18n.t('agenda.requests.updateError');
    } finally {
      this.updatingServiceRequestId = null;
    }
  }

  async convertServiceRequest(request: ServiceRequestViewModel): Promise<void> {
    this.convertingServiceRequestId = request.id;
    this.serviceRequestError = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.serviceRequestError = this.i18n.t('agenda.requests.convertAuthError');
        return;
      }

      await this.apiService.convertWorkshopServiceRequest(token, request.id, {
        scheduledStartAt: request.preferredDateTime ?? undefined,
      });
      await this.loadAgenda();
    } catch (error) {
      console.error('Failed to convert service request', error);
      this.serviceRequestError = this.i18n.t('agenda.requests.convertError');
    } finally {
      this.convertingServiceRequestId = null;
    }
  }

  formatHours(value: number): string {
    return `${value}h`;
  }

  formatWorkOrderStatus(status: WorkOrderViewModel['status']): string {
    return this.i18n.t(`workOrders.status.${status}`);
  }

  private buildAgendaItems(
    appointments: AppointmentViewModel[],
    customers: CustomerViewModel[],
    vehicles: VehicleViewModel[],
    services: ServiceViewModel[],
    workOrders: WorkOrderViewModel[],
  ): AgendaItemViewModel[] {
    const customerMap = new Map(customers.map((customer) => [customer.id, customer]));
    const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
    const serviceMap = new Map(services.map((service) => [service.id, service]));
    const workOrderMap = new Map(
      workOrders.map((workOrder) => [workOrder.appointmentId, workOrder]),
    );

    return appointments.map((appointment) => {
      const customer = customerMap.get(appointment.clientId);
      const vehicle = vehicleMap.get(appointment.vehicleId);
      const service = serviceMap.get(appointment.serviceId);

      return {
        appointment,
        customerName: customer?.name?.trim() || this.i18n.t('agenda.customerMissing'),
        customerNote: customer
          ? customer.email || customer.phone || this.i18n.t('agenda.customerExisting')
          : this.i18n.t('agenda.customerMissingNote'),
        vehicleLabel: this.describeVehicle(vehicle),
        vehicleNote: vehicle
          ? vehicle.plate
            ? this.i18n.t('agenda.platePrefix', { value: vehicle.plate })
            : this.i18n.t('agenda.vehicleExisting')
          : this.i18n.t('agenda.vehicleMissingNote'),
        serviceLabel: service?.name?.trim() || this.i18n.t('agenda.serviceMissing'),
        serviceNote: service
          ? this.i18n.t('agenda.serviceEstimated', {
            value: this.formatHours(service.estimatedDurationHours),
          })
          : this.i18n.t('agenda.serviceMissingNote'),
        workOrder: workOrderMap.get(appointment.id) ?? null,
      };
    });
  }

  private buildServiceRequestItems(
    requests: ServiceRequestViewModel[],
    customers: CustomerViewModel[],
    vehicles: VehicleViewModel[],
    services: ServiceViewModel[],
  ): ServiceRequestListItemViewModel[] {
    const customerMap = new Map(customers.map((customer) => [customer.id, customer]));
    const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
    const serviceMap = new Map(services.map((service) => [service.id, service]));

    return requests.map((request) => ({
      request,
      customerName:
        customerMap.get(request.customerId)?.name ?? this.i18n.t('agenda.customerMissing'),
      vehicleLabel: this.describeVehicle(vehicleMap.get(request.vehicleId)),
      serviceLabel:
        serviceMap.get(request.serviceId)?.name ?? this.i18n.t('agenda.serviceMissing'),
    }));
  }

  formatReference(value: string | null | undefined): string {
    return value?.trim() || this.i18n.t('common.notAvailable');
  }

  private describeVehicle(vehicle: VehicleViewModel | undefined): string {
    if (!vehicle) {
      return this.i18n.t('agenda.vehicleMissing');
    }

    const details = [vehicle.brand, vehicle.model, vehicle.year ? `${vehicle.year}` : null]
      .filter((value): value is string => Boolean(value))
      .join(' ');

    return details ? `${vehicle.plate} - ${details}` : vehicle.plate;
  }

  formatServiceRequestStatus(
    status: ServiceRequestViewModel['status'],
  ): string {
    return this.i18n.t(`agenda.requests.status.${status}`);
  }

  formatPreferredRequestDate(request: ServiceRequestViewModel): string {
    return request.preferredDateTime
      ? this.formatPreferredDateTime(request.preferredDateTime)
      : request.preferredDate ?? this.i18n.t('common.notSet');
  }

  private formatPreferredDateTime(value: string): string {
    const date = new Date(value);

    return new Intl.DateTimeFormat(
      this.i18n.language() === 'en' ? 'en-US' : 'es-AR',
      {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(date);
  }
}
