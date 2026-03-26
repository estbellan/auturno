import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-pending-recommendations-page',
  standalone: true,
  imports: [PageShellComponent],
  templateUrl: './pending-recommendations-page.component.html',
})
export class PendingRecommendationsPageComponent {
  readonly i18n = inject(I18nService);
}
