import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'at-login-page',
  standalone: true,
  template: `
    <article class="card">
      <h2>Authentication Gateway</h2>
      <p>
        Auth0 SPA login entry point. Frontend captures the session and access token,
        while the API remains the source of truth for authorization, tenancy, RBAC,
        and workflow validation.
      </p>

      <div class="actions">
        <button type="button" (click)="login()">Log in</button>
        <button type="button" (click)="signup()">Sign up</button>
      </div>
    </article>
  `,
  styles: [`
    .card {
      max-width: 520px;
      margin: 40px auto;
      padding: 24px;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    button {
      padding: 10px 16px;
      border: 0;
      border-radius: 10px;
      cursor: pointer;
    }
  `],
})
export class LoginPageComponent {
  constructor(private readonly authService: AuthService) {}

  async login() {
    await this.authService.login();
  }

  async signup() {
    await this.authService.signup();
  }
}