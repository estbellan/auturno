import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ClientWelcomeSplashComponent } from '../../../client-portal/components/client-welcome-splash.component';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { AuthService } from '../../auth.service';
import { I18nService } from '../../i18n/i18n.service';
import { SessionStore } from '../../state/session.store';

interface NavTab {
  path: string;
  exact: boolean;
  icon: string;
  labelKey: string;
}

@Component({
  selector: 'at-client-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeToggleComponent, LanguageSwitcherComponent, ClientWelcomeSplashComponent],
  templateUrl: './client-layout.component.html',
  styleUrl: './client-layout.component.scss',
})
export class ClientLayoutComponent {
  private readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly sessionStore = inject(SessionStore);

  readonly currentUser = computed(() => this.sessionStore.currentUser());
  readonly profileOpen = signal(false);

  readonly tabs: NavTab[] = [
    { path: '/client',                      exact: true,  icon: 'home',            labelKey: 'nav.client.home'         },
    { path: '/client/work-orders/status',   exact: false, icon: 'handyman',        labelKey: 'nav.client.workOrders'   },
    { path: '/client/appointments/request', exact: false, icon: 'calendar_add_on', labelKey: 'nav.client.appointments' },
    { path: '/client/quotes/review',        exact: false, icon: 'request_quote',   labelKey: 'nav.client.quotes'       },
    { path: '/client/history/services',     exact: false, icon: 'history',         labelKey: 'nav.client.history'      },
  ];

  initials(name: string): string {
    if (!name) return '?';
    return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  async changePassword(): Promise<void> {
    this.profileOpen.set(false);
    await this.authService.changePassword();
  }

  async logout(): Promise<void> {
    this.profileOpen.set(false);
    this.sessionStore.clearSession();
    await this.authService.logout();
  }
}
