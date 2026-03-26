import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-loyalty-points-page',
  standalone: true,
  imports: [PageShellComponent],
  templateUrl: './loyalty-points-page.component.html',
})
export class LoyaltyPointsPageComponent {
  readonly i18n = inject(I18nService);
}
