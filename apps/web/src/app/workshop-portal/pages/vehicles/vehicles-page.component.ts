import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-vehicles-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Vehicles" description="Vehicle profile and service linkage view for workshop operations." />'
})
export class VehiclesPageComponent {}
