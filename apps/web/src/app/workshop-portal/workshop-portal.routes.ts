import { Routes } from '@angular/router';
import { workshopRoutePermissions } from '../core/access/workshop-access.config';
import { workshopHomeGuard } from '../core/guards/workshop-home.guard';
import { portalAccessGuard } from '../core/guards/portal-access.guard';
import { EntryRedirectPageComponent } from '../core/pages/entry-redirect-page.component';
import { WorkshopLayoutComponent } from '../core/layouts/workshop-layout/workshop-layout.component';

export const WORKSHOP_PORTAL_ROUTES: Routes = [
  {
    path: '',
    component: WorkshopLayoutComponent,
    canActivate: [portalAccessGuard],
    canActivateChild: [portalAccessGuard],
    data: { portal: 'workshop' },
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [workshopHomeGuard],
        component: EntryRedirectPageComponent,
      },
      {
        path: 'agenda',
        data: { requiredPermissions: workshopRoutePermissions.agenda },
        loadComponent: () =>
          import('./pages/agenda/agenda-page.component').then(
            (module) => module.AgendaPageComponent,
          ),
      },
      {
        path: 'agenda/intake',
        data: { requiredPermissions: workshopRoutePermissions.agendaIntake },
        loadComponent: () =>
          import('./pages/agenda/appointment-intake-page.component').then(
            (module) => module.AppointmentIntakePageComponent,
          ),
      },
      {
        path: 'services',
        data: { requiredPermissions: workshopRoutePermissions.services },
        loadComponent: () =>
          import('./pages/services/services-page.component').then(
            (module) => module.ServicesPageComponent,
          ),
      },
      {
        path: 'work-orders',
        data: { requiredPermissions: workshopRoutePermissions.workOrders },
        loadComponent: () =>
          import('./pages/work-orders/work-orders-page.component').then(
            (module) => module.WorkOrdersPageComponent,
          ),
      },
      {
        path: 'work-orders/:id',
        data: { requiredPermissions: workshopRoutePermissions.workOrderDetail },
        loadComponent: () =>
          import('./pages/work-orders/work-order-detail-page.component').then(
            (module) => module.WorkOrderDetailPageComponent,
          ),
      },
      {
        path: 'diagnostics',
        data: { requiredPermissions: workshopRoutePermissions.diagnostics },
        loadComponent: () =>
          import('./pages/diagnostics/diagnostics-page.component').then(
            (module) => module.DiagnosticsPageComponent,
          ),
      },
      {
        path: 'quotes',
        data: { requiredPermissions: workshopRoutePermissions.quotes },
        loadComponent: () =>
          import('./pages/quotes/quotes-page.component').then(
            (module) => module.QuotesPageComponent,
          ),
      },
      {
        path: 'customers',
        data: { requiredPermissions: workshopRoutePermissions.customers },
        loadComponent: () =>
          import('./pages/customers/customers-page.component').then(
            (module) => module.CustomersPageComponent,
          ),
      },
      {
        path: 'vehicles',
        data: { requiredPermissions: workshopRoutePermissions.vehicles },
        loadComponent: () =>
          import('./pages/vehicles/vehicles-page.component').then(
            (module) => module.VehiclesPageComponent,
          ),
      },
      {
        path: 'metrics',
        data: { requiredPermissions: workshopRoutePermissions.metrics },
        loadComponent: () =>
          import('./pages/metrics/metrics-page.component').then(
            (module) => module.MetricsPageComponent,
          ),
      },
      {
        path: 'setup',
        loadComponent: () =>
          import('./pages/setup/workshop-setup-page.component').then(
            (module) => module.WorkshopSetupPageComponent,
          ),
      },
    ]
  }
];
