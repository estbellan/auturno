import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-service-history-page',
  standalone: true,
  imports: [PageShellComponent],
  templateUrl: './service-history-page.component.html',
})
export class ServiceHistoryPageComponent {
  readonly i18n = inject(I18nService);
}
