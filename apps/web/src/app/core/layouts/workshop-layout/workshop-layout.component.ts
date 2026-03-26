import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import {
  getVisibleWorkshopNavItems,
  getWorkshopRoleSummary,
} from '../../access/workshop-access.config';
import { AuthService } from '../../auth.service';
import { I18nService } from '../../i18n/i18n.service';
import { SessionStore } from '../../state/session.store';

@Component({
  selector: 'at-workshop-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeToggleComponent, LanguageSwitcherComponent],
  templateUrl: './workshop-layout.component.html',
  styleUrl: './workshop-layout.component.scss',
})
export class WorkshopLayoutComponent {
  private readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly sessionStore = inject(SessionStore);

  readonly drawerOpen = signal(false);
  readonly sidebarCollapsed = signal(false);
  readonly currentUser = computed(() => this.sessionStore.currentUser());
  readonly visibleNavItems = computed(() =>
    getVisibleWorkshopNavItems(this.sessionStore.currentUser()),
  );
  readonly roleSummary = computed(() =>
    getWorkshopRoleSummary(this.sessionStore.currentUser()),
  );

  isDesktop(): boolean {
    return window.matchMedia('(min-width: 1024px)').matches;
  }

  toggleSidebar(): void {
    if (this.isDesktop()) {
      this.sidebarCollapsed.update(v => !v);
    } else {
      this.drawerOpen.set(false);
    }
  }

  onNavClick(): void {
    if (!this.isDesktop()) {
      this.drawerOpen.set(false);
    }
  }

  initials(name: string): string {
    if (!name) return '?';
    return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  async logout(): Promise<void> {
    this.sessionStore.clearSession();
    await this.authService.logout();
  }
}
