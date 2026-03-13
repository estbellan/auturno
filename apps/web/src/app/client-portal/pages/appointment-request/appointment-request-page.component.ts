import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-appointment-request-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Appointment Request" description="Submit service requests to workshop availability endpoints. No client-side capacity calculations." />'
})
export class AppointmentRequestPageComponent {}
