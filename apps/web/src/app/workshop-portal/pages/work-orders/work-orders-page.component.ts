import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-work-orders-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Work Orders" description="Operational board for direct and diagnostic work orders with backend-managed phase transitions." />'
})
export class WorkOrdersPageComponent {}
