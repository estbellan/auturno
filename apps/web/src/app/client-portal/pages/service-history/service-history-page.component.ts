import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-service-history-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Service History" description="Historical completed orders and diagnostics context surfaced from API records." />'
})
export class ServiceHistoryPageComponent {}
