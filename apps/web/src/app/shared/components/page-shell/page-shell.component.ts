import { Component, Input } from '@angular/core';

@Component({
  selector: 'at-page-shell',
  standalone: true,
  template: `
    <article class="card">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </article>
  `
})
export class PageShellComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
}
