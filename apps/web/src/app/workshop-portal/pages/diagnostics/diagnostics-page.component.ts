import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-diagnostics-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Diagnostics" description="Diagnosis findings and recommendations capture, strictly separated from operation execution." />'
})
export class DiagnosticsPageComponent {}
