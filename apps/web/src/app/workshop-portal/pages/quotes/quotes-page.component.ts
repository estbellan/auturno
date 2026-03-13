import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-quotes-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Quotes" description="Draft, send, and monitor quote statuses; approvals trigger backend transition to operation." />'
})
export class QuotesPageComponent {}
