import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'at-public-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <section class="app-shell">
      <header class="layout-header">
        <h1>AUTURNO</h1>
        <p>Workshop operating system - API-first frontend shell</p>
        <nav class="nav-list">
          <a class="nav-link" routerLink="/auth/login">Login</a>
          <a class="nav-link" routerLink="/client/appointments/request">Client Portal</a>
          <a class="nav-link" routerLink="/workshop/agenda">Workshop Portal</a>
        </nav>
      </header>
      <main class="layout-content">
        <router-outlet />
      </main>
    </section>
  `
})
export class PublicLayoutComponent {}
