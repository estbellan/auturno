import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-work-order-status-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Work Order & Vehicle Status" description="Read-only timeline view of current work order phase and expected dates from API." />'
})
export class WorkOrderStatusPageComponent {}
