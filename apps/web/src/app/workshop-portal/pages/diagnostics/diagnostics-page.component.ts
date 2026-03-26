import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-diagnostics-page',
  standalone: true,
  imports: [PageShellComponent],
  templateUrl: './diagnostics-page.component.html',
})
export class DiagnosticsPageComponent {
  readonly i18n = inject(I18nService);
}
