import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'at-client-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <section class="app-shell">
      <header class="layout-header">
        <h1>Client Portal</h1>
        <nav class="nav-list">
          <a class="nav-link" routerLink="/client/appointments/request">Appointment Request</a>
          <a class="nav-link" routerLink="/client/work-orders/status">Work Order Status</a>
          <a class="nav-link" routerLink="/client/quotes/review">Quote Decision</a>
          <a class="nav-link" routerLink="/client/history/services">Service History</a>
          <a class="nav-link" routerLink="/client/recommendations/pending">Recommendations</a>
          <a class="nav-link" routerLink="/client/loyalty/points">Loyalty</a>
        </nav>
      </header>
      <main class="layout-content">
        <router-outlet />
      </main>
      <footer class="layout-footer">Customer-facing V1 scope only.</footer>
    </section>
  `
})
export class ClientLayoutComponent {}
