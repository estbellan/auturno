import { Injectable } from '@angular/core';

const PREFIX = 'at-hint:';

@Injectable({ providedIn: 'root' })
export class HintService {
  isDismissed(key: string): boolean {
    return localStorage.getItem(PREFIX + key) === '1';
  }

  dismiss(key: string): void {
    localStorage.setItem(PREFIX + key, '1');
  }

  reset(key: string): void {
    localStorage.removeItem(PREFIX + key);
  }
}
