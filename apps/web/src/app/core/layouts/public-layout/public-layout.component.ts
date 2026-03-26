import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'at-public-layout',
  standalone: true,
  imports: [RouterOutlet, ThemeToggleComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  readonly year = new Date().getFullYear();
}
