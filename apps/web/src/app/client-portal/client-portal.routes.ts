import { Routes } from '@angular/router';
import { portalAccessGuard } from '../core/guards/portal-access.guard';
import { ClientLayoutComponent } from '../core/layouts/client-layout/client-layout.component';
import { AppointmentRequestPageComponent } from './pages/appointment-request/appointment-request-page.component';
import { ClientHomePageComponent } from './pages/client-home/client-home-page.component';
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
    canActivateChild: [portalAccessGuard],
    data: { portal: 'client' },
    children: [
      { path: '', pathMatch: 'full', component: ClientHomePageComponent },
      { path: 'appointments/request', component: AppointmentRequestPageComponent },
      { path: 'work-orders/status', component: WorkOrderStatusPageComponent },
      { path: 'work-orders/status/:id', component: WorkOrderStatusPageComponent },
      { path: 'quotes/review', component: QuoteDecisionPageComponent },
      { path: 'history/services', component: ServiceHistoryPageComponent },
      { path: 'recommendations/pending', component: PendingRecommendationsPageComponent },
      { path: 'loyalty/points', component: LoyaltyPointsPageComponent }
    ]
  }
];
