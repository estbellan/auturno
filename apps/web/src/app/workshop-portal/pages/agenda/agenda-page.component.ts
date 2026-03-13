import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-agenda-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Agenda" description="Capacity-based appointment and workload calendar driven by backend scheduling APIs." />'
})
export class AgendaPageComponent {}
