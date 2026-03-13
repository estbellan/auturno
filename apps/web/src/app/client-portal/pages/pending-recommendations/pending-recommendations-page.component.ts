import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-pending-recommendations-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Pending Recommendations" description="Unresolved diagnosis recommendations for future follow-up, without auto-concluding diagnosis." />'
})
export class PendingRecommendationsPageComponent {}
