import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { I18nService } from '../i18n/i18n.service';
import { SessionStore } from '../state/session.store';

@Component({
  selector: 'at-access-denied-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './access-denied-page.component.html',
  styleUrl: './access-denied-page.component.scss',
})
export class AccessDeniedPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly sessionStore = inject(SessionStore);
  readonly i18n = inject(I18nService);

  readonly fromPath = computed(() => this.route.snapshot.queryParamMap.get('from'));
  readonly defaultPortalUrl = computed(() => this.sessionStore.defaultPortalUrl());
}
