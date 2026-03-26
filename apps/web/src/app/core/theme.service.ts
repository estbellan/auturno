import { Injectable, signal, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'at-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _mode = signal<ThemeMode>(this.loadMode());

  readonly mode = this._mode.asReadonly();

  readonly resolvedTheme = computed<'light' | 'dark'>(() => {
    const m = this._mode();
    if (m !== 'system') return m;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  constructor() {
    // Apply immediately (inline script in index.html handles the initial paint;
    // this keeps the signal in sync after the app boots).
    this.applyToDom();

    // React to OS preference changes when mode is 'system'.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this._mode() === 'system') this.applyToDom();
    });
  }

  setMode(mode: ThemeMode): void {
    this._mode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    this.applyToDom();
  }

  cycle(): void {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(this._mode()) + 1) % order.length];
    this.setMode(next);
  }

  private applyToDom(): void {
    const resolved = this.resolvedTheme();
    document.documentElement.setAttribute('data-theme', resolved);
  }

  private loadMode(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system';
  }
}
