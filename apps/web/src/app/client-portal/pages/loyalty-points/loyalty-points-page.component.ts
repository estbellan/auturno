import { Component } from '@angular/core';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'at-loyalty-points-page',
  standalone: true,
  imports: [PageShellComponent],
  template: '<at-page-shell title="Loyalty Points" description="Simple points summary from completed work orders and configured workshop rules." />'
})
export class LoyaltyPointsPageComponent {}
