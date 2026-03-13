import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-customers-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Customers" description="Workshop-scoped customer records and communication context from tenant-protected APIs." />'
})
export class CustomersPageComponent {}
