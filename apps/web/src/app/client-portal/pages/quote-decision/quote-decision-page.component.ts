import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-quote-decision-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Quote Approval / Rejection" description="Display itemized quote payload and submit approve/reject actions to backend." />'
})
export class QuoteDecisionPageComponent {}
