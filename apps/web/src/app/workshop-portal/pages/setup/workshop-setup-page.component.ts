import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { SessionStore } from '../../../core/state/session.store';

@Component({
  selector: 'at-workshop-setup-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './workshop-setup-page.component.html',
  styleUrl: './workshop-setup-page.component.scss',
})
export class WorkshopSetupPageComponent implements OnInit {
  protected name = '';
  protected working = false;
  protected error: string | null = null;

  readonly i18n = inject(I18nService);
  private readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const user = this.sessionStore.currentUser();
    if (user?.workshopId) {
      void this.router.navigateByUrl(this.sessionStore.defaultPortalUrl() ?? '/workshop');
    }
  }

  async submit(): Promise<void> {
    const trimmedName = this.name.trim();
    if (!trimmedName || this.working) {
      return;
    }

    this.working = true;
    this.error = null;

    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        this.error = this.i18n.t('setup.authError');
        return;
      }

      await this.apiService.bootstrapWorkshop(token, trimmedName);
      await this.sessionStore.bootstrap(true);

      const url = this.sessionStore.defaultPortalUrl();
      await this.router.navigateByUrl(url ?? '/workshop');
    } catch {
      this.error = this.i18n.t('setup.error');
    } finally {
      this.working = false;
    }
  }
}
