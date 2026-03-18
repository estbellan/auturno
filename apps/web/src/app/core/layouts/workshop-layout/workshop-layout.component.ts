import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'at-workshop-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <section class="app-shell">
      <header class="layout-header">
        <h1>Workshop Portal</h1>
        <nav class="nav-list">
          <a class="nav-link" routerLink="/workshop/agenda" routerLinkActive="active">Agenda</a>
          <a class="nav-link" routerLink="/workshop/services" routerLinkActive="active">Services</a>
          <a class="nav-link" routerLink="/workshop/work-orders" routerLinkActive="active">Work Orders</a>
          <a class="nav-link" routerLink="/workshop/diagnostics" routerLinkActive="active">Diagnostics</a>
          <a class="nav-link" routerLink="/workshop/quotes" routerLinkActive="active">Quotes</a>
          <a class="nav-link" routerLink="/workshop/customers" routerLinkActive="active">Customers</a>
          <a class="nav-link" routerLink="/workshop/vehicles" routerLinkActive="active">Vehicles</a>
          <a class="nav-link" routerLink="/workshop/metrics" routerLinkActive="active">Metrics</a>
        </nav>
      </header>
      <main class="layout-content">
        <router-outlet />
      </main>
      <footer class="layout-footer">Operational portal - backend remains source of business truth.</footer>
    </section>
  `,
  styles: [
    `
      .nav-link.active {
        color: #1d4ed8;
        font-weight: 700;
      }
    `,
  ],
})
export class WorkshopLayoutComponent {}
