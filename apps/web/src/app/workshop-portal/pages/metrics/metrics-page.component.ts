import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-metrics-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Metrics (Placeholder)" description="Reserved UI entry for silent metrics visibility without advanced V1 dashboard logic." />'
})
export class MetricsPageComponent {}
