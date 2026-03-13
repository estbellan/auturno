import { Routes } from '@angular/router';
import { portalAccessGuard } from '../core/guards/portal-access.guard';
import { WorkshopLayoutComponent } from '../core/layouts/workshop-layout/workshop-layout.component';
import { AgendaPageComponent } from './pages/agenda/agenda-page.component';
import { CustomersPageComponent } from './pages/customers/customers-page.component';
import { DiagnosticsPageComponent } from './pages/diagnostics/diagnostics-page.component';
import { MetricsPageComponent } from './pages/metrics/metrics-page.component';
import { QuotesPageComponent } from './pages/quotes/quotes-page.component';
import { VehiclesPageComponent } from './pages/vehicles/vehicles-page.component';
import { WorkOrdersPageComponent } from './pages/work-orders/work-orders-page.component';

export const WORKSHOP_PORTAL_ROUTES: Routes = [
  {
    path: '',
    component: WorkshopLayoutComponent,
    canActivate: [portalAccessGuard],
    children: [
      { path: 'agenda', component: AgendaPageComponent },
      { path: 'work-orders', component: WorkOrdersPageComponent },
      { path: 'diagnostics', component: DiagnosticsPageComponent },
      { path: 'quotes', component: QuotesPageComponent },
      { path: 'customers', component: CustomersPageComponent },
      { path: 'vehicles', component: VehiclesPageComponent },
      { path: 'metrics', component: MetricsPageComponent },
      { path: '', pathMatch: 'full', redirectTo: 'agenda' }
    ]
  }
];
