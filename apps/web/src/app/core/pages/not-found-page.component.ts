import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../i18n/i18n.service';

@Component({
  selector: 'at-not-found-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.scss',
})
export class NotFoundPageComponent {
  readonly i18n = inject(I18nService);
}
