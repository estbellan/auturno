import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-quotes-page',
  standalone: true,
  imports: [PageShellComponent],
  templateUrl: './quotes-page.component.html',
})
export class QuotesPageComponent {
  readonly i18n = inject(I18nService);
}
