import { Routes } from '@angular/router';
import { portalAccessGuard } from '../core/guards/portal-access.guard';
import { ClientLayoutComponent } from '../core/layouts/client-layout/client-layout.component';
import { AppointmentRequestPageComponent } from './pages/appointment-request/appointment-request-page.component';
import { LoyaltyPointsPageComponent } from './pages/loyalty-points/loyalty-points-page.component';
import { PendingRecommendationsPageComponent } from './pages/pending-recommendations/pending-recommendations-page.component';
import { QuoteDecisionPageComponent } from './pages/quote-decision/quote-decision-page.component';
import { ServiceHistoryPageComponent } from './pages/service-history/service-history-page.component';
import { WorkOrderStatusPageComponent } from './pages/work-order-status/work-order-status-page.component';

export const CLIENT_PORTAL_ROUTES: Routes = [
  {
    path: '',
    component: ClientLayoutComponent,
    canActivate: [portalAccessGuard],
    children: [
      { path: 'appointments/request', component: AppointmentRequestPageComponent },
      { path: 'work-orders/status', component: WorkOrderStatusPageComponent },
      { path: 'quotes/review', component: QuoteDecisionPageComponent },
      { path: 'history/services', component: ServiceHistoryPageComponent },
      { path: 'recommendations/pending', component: PendingRecommendationsPageComponent },
      { path: 'loyalty/points', component: LoyaltyPointsPageComponent },
      { path: '', pathMatch: 'full', redirectTo: 'appointments/request' }
    ]
  }
];
