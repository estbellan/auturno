import { Component, Input } from '@angular/core';

@Component({
  selector: 'at-page-shell',
  standalone: true,
  templateUrl: './page-shell.component.html',
  styleUrl: './page-shell.component.scss',
})
export class PageShellComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() icon = '';
}
