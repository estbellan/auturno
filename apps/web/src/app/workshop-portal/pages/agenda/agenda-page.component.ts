import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  ApiService,
  AppointmentViewModel,
  CustomerViewModel,
  ServiceViewModel,
  VehicleViewModel,
  WorkOrderViewModel,
} from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

interface AgendaItemViewModel {
  appointment: AppointmentViewModel;
  customerName: string;
  vehicleLabel: string;
  serviceLabel: string;
  workOrder: WorkOrderViewModel | null;
}

@Component({
  selector: 'at-agenda-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageShellComponent],
  template: `
    <section class="agenda-page">
      <at-page-shell
        title="Agenda"
        description="Upcoming intake work with quick access to open or continue work orders."
      />

      <section class="card action-card">
        <div class="action-copy">
          <h2>New intake</h2>
          <p>Create an appointment and immediately open its work order.</p>
        </div>
        <a class="action-link" routerLink="/workshop/agenda/intake">Start intake</a>
      </section>

      <section class="card list-card">
        <div class="section-header">
          <div>
            <h2>Upcoming work</h2>
            <p>Appointments are ordered by scheduled start so the workshop can act on the next jobs first.</p>
          </div>
        </div>

        @if (loading) {
          <section class="status-card neutral">Loading upcoming appointments...</section>
        } @else if (error) {
          <section class="status-card error">{{ error }}</section>
        } @else if (!agendaItems.length) {
          <section class="status-card neutral">No appointments scheduled yet for this workshop.</section>
        } @else {
          <div class="agenda-list">
            @for (item of agendaItems; track item.appointment.id) {
              <article class="agenda-item">
                <div class="agenda-main">
                  <div class="headline-row">
                    <div>
                      <p class="eyebrow">Scheduled</p>
                      <h3>{{ item.customerName }}</h3>
                    </div>

                    @if (item.workOrder) {
                      <span class="status-badge work-order">{{ formatWorkOrderStatus(item.workOrder.status) }}</span>
                    } @else {
                      <span class="status-badge appointment">Appointment only</span>
                    }
                  </div>

                  <div class="detail-grid">
                    <div>
                      <p class="detail-label">Vehicle</p>
                      <span>{{ item.vehicleLabel }}</span>
                    </div>
                    <div>
                      <p class="detail-label">Service</p>
                      <span>{{ item.serviceLabel }}</span>
                    </div>
                    <div>
                      <p class="detail-label">Start</p>
                      <span>{{ item.appointment.scheduledStartAt | date: 'EEE d MMM, HH:mm' }}</span>
                    </div>
                    <div>
                      <p class="detail-label">Planned hours</p>
                      <span>{{ formatHours(item.appointment.estimatedDurationHours) }}</span>
                    </div>
                  </div>

                  <div class="reference-grid">
                    <p>Client: {{ item.appointment.clientId }}</p>
                    <p>Vehicle ID: {{ item.appointment.vehicleId }}</p>
                    <p>Service ID: {{ item.appointment.serviceId }}</p>
                  </div>
                </div>

                <div class="agenda-actions">
                  @if (item.workOrder) {
                    <a
                      class="secondary-link"
                      [routerLink]="['/workshop/work-orders', item.workOrder.id]"
                    >
                      Open work order
                    </a>
                  } @else {
                    <button
                      type="button"
                      class="primary-button"
                      [disabled]="openingAppointmentId === item.appointment.id"
                      (click)="openWorkOrder(item.appointment.id)"
                    >
                      {{
                        openingAppointmentId === item.appointment.id
                          ? 'Opening work order...'
                          : 'Create and open work order'
                      }}
                    </button>
                  }
                </div>
              </article>
            }
          </div>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .agenda-page {
        display: grid;
        gap: 1rem;
      }

      .card {
        border-radius: 16px;
        background: #ffffff;
        border: 1px solid #dbe4f0;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      }

      .action-card,
      .list-card {
        padding: 1rem;
      }

      .action-card {
        display: grid;
        gap: 0.9rem;
      }

      .action-copy,
      .section-header {
        display: grid;
        gap: 0.35rem;
      }

      .section-header {
        margin-bottom: 0.9rem;
      }

      h2,
      h3,
      p {
        margin: 0;
      }

      h2,
      h3 {
        color: #0f172a;
      }

      .section-header p,
      .action-copy p {
        color: #64748b;
      }

      .action-link,
      .primary-button,
      .secondary-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        font: inherit;
        font-weight: 600;
        text-decoration: none;
        border: none;
        cursor: pointer;
      }

      .action-link,
      .primary-button {
        background: #1d4ed8;
        color: #ffffff;
      }

      .secondary-link {
        background: #eff6ff;
        color: #1d4ed8;
      }

      .agenda-list {
        display: grid;
        gap: 0.9rem;
      }

      .agenda-item {
        display: grid;
        gap: 0.9rem;
        padding: 1rem;
        border-radius: 14px;
        border: 1px solid #dbe4f0;
        background: #f8fafc;
      }

      .agenda-main {
        display: grid;
        gap: 0.9rem;
      }

      .headline-row {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: flex-start;
      }

      .eyebrow,
      .detail-label {
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .detail-grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .detail-grid span,
      .reference-grid p {
        color: #334155;
      }

      .reference-grid {
        display: grid;
        gap: 0.2rem;
        padding-top: 0.2rem;
        border-top: 1px solid #e2e8f0;
        font-size: 0.85rem;
      }

      .agenda-actions {
        display: grid;
      }

      .status-card {
        padding: 0.9rem 1rem;
        border-radius: 12px;
        font-weight: 600;
      }

      .neutral {
        color: #334155;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }

      .error {
        color: #991b1b;
        background: #fef2f2;
        border: 1px solid #fecaca;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.45rem 0.7rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 700;
      }

      .status-badge.work-order {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .status-badge.appointment {
        background: #e2e8f0;
        color: #334155;
      }

      button[disabled] {
        opacity: 0.7;
      }

      @media (min-width: 768px) {
        .action-card {
          grid-template-columns: 1fr auto;
          align-items: center;
        }

        .agenda-item {
          grid-template-columns: 1fr auto;
          align-items: center;
        }

        .agenda-actions {
          align-self: stretch;
          align-content: center;
        }
      }
    `,
  ],
})
export class AgendaPageComponent implements OnInit {
  agendaItems: AgendaItemViewModel[] = [];
  loading = true;
  openingAppointmentId: string | null = null;
  error = '';

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAgenda();
  }

  async loadAgenda(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = 'Unable to load agenda without an authenticated session.';
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
    } catch (error) {
      console.error('Failed to load agenda', error);
      this.error = 'Failed to load upcoming work for this workshop.';
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
        this.error = 'Unable to open a work order without an authenticated session.';
        return;
      }

      const workOrder = await this.apiService.createWorkOrderFromAppointment(
        token,
        appointmentId,
      );

      await this.router.navigate(['/workshop/work-orders', workOrder.id]);
    } catch (error) {
      console.error('Failed to open work order from agenda', error);
      this.error = 'Failed to create or open the work order for this appointment.';
    } finally {
      this.openingAppointmentId = null;
    }
  }

  formatHours(value: number): string {
    return `${value}h`;
  }

  formatWorkOrderStatus(status: WorkOrderViewModel['status']): string {
    return status.replace(/_/g, ' ');
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
        customerName: customer?.name ?? appointment.clientId,
        vehicleLabel: this.describeVehicle(vehicle, appointment.vehicleId),
        serviceLabel: service?.name ?? appointment.serviceId,
        workOrder: workOrderMap.get(appointment.id) ?? null,
      };
    });
  }

  private describeVehicle(
    vehicle: VehicleViewModel | undefined,
    fallbackVehicleId: string,
  ): string {
    if (!vehicle) {
      return fallbackVehicleId;
    }

    const details = [vehicle.brand, vehicle.model, vehicle.year ? `${vehicle.year}` : null]
      .filter((value): value is string => Boolean(value))
      .join(' ');

    return details ? `${vehicle.plate} - ${details}` : vehicle.plate;
  }
}
