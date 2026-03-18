import { Routes } from '@angular/router';
import { portalAccessGuard } from '../core/guards/portal-access.guard';
import { WorkshopLayoutComponent } from '../core/layouts/workshop-layout/workshop-layout.component';

export const WORKSHOP_PORTAL_ROUTES: Routes = [
  {
    path: '',
    component: WorkshopLayoutComponent,
    canActivate: [portalAccessGuard],
    children: [
      {
        path: 'agenda',
        loadComponent: () =>
          import('./pages/agenda/agenda-page.component').then(
            (module) => module.AgendaPageComponent,
          ),
      },
      {
        path: 'agenda/intake',
        loadComponent: () =>
          import('./pages/agenda/appointment-intake-page.component').then(
            (module) => module.AppointmentIntakePageComponent,
          ),
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./pages/services/services-page.component').then(
            (module) => module.ServicesPageComponent,
          ),
      },
      {
        path: 'work-orders',
        loadComponent: () =>
          import('./pages/work-orders/work-orders-page.component').then(
            (module) => module.WorkOrdersPageComponent,
          ),
      },
      {
        path: 'work-orders/:id',
        loadComponent: () =>
          import('./pages/work-orders/work-order-detail-page.component').then(
            (module) => module.WorkOrderDetailPageComponent,
          ),
      },
      {
        path: 'diagnostics',
        loadComponent: () =>
          import('./pages/diagnostics/diagnostics-page.component').then(
            (module) => module.DiagnosticsPageComponent,
          ),
      },
      {
        path: 'quotes',
        loadComponent: () =>
          import('./pages/quotes/quotes-page.component').then(
            (module) => module.QuotesPageComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./pages/customers/customers-page.component').then(
            (module) => module.CustomersPageComponent,
          ),
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./pages/vehicles/vehicles-page.component').then(
            (module) => module.VehiclesPageComponent,
          ),
      },
      {
        path: 'metrics',
        loadComponent: () =>
          import('./pages/metrics/metrics-page.component').then(
            (module) => module.MetricsPageComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'agenda' }
    ]
  }
];
