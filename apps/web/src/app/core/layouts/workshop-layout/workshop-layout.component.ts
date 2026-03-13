import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'at-workshop-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <section class="app-shell">
      <header class="layout-header">
        <h1>Workshop Portal</h1>
        <nav class="nav-list">
          <a class="nav-link" routerLink="/workshop/agenda">Agenda</a>
          <a class="nav-link" routerLink="/workshop/work-orders">Work Orders</a>
          <a class="nav-link" routerLink="/workshop/diagnostics">Diagnostics</a>
          <a class="nav-link" routerLink="/workshop/quotes">Quotes</a>
          <a class="nav-link" routerLink="/workshop/customers">Customers</a>
          <a class="nav-link" routerLink="/workshop/vehicles">Vehicles</a>
          <a class="nav-link" routerLink="/workshop/metrics">Metrics</a>
        </nav>
      </header>
      <main class="layout-content">
        <router-outlet />
      </main>
      <footer class="layout-footer">Operational portal - backend remains source of business truth.</footer>
    </section>
  `
})
export class WorkshopLayoutComponent {}
