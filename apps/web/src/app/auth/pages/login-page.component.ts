import { Component } from '@angular/core';

@Component({
  selector: 'at-login-page',
  standalone: true,
  template: `
    <article class="card">
      <h2>Authentication Gateway</h2>
      <p>
        Auth0 SPA login entry point. Frontend captures credentials/token and delegates authorization,
        tenancy, RBAC, and workflow validation to the API.
      </p>
    </article>
  `
})
export class LoginPageComponent {}
