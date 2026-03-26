import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SessionStore } from '../../core/state/session.store';

@Component({
  selector: 'at-login-page',
  standalone: true,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  readonly sessionStore = inject(SessionStore);
  readonly returnUrl = computed(() =>
    this.sessionStore.resolveReturnUrl(
      this.route.snapshot.queryParamMap.get('returnUrl'),
    ),
  );

  async login(): Promise<void> {
    await this.authService.login(this.returnUrl() ?? '/');
  }

  async signup(): Promise<void> {
    await this.authService.signup(this.returnUrl() ?? '/');
  }
}
