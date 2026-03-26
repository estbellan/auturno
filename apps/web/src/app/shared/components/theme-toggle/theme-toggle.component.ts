import { Component, inject } from '@angular/core';
import { ThemeMode, ThemeService } from '../../../core/theme.service';

interface ThemeOption {
  mode: ThemeMode;
  icon: string;
  label: string;
}

@Component({
  selector: 'at-theme-toggle',
  standalone: true,
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);

  readonly options: ThemeOption[] = [
    { mode: 'light',  icon: 'light_mode',     label: 'Modo claro'    },
    { mode: 'dark',   icon: 'dark_mode',       label: 'Modo oscuro'   },
    { mode: 'system', icon: 'brightness_auto', label: 'Según sistema' },
  ];
}
