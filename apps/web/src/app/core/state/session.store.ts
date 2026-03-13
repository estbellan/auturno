import { Injectable, signal } from '@angular/core';

export type PortalType = 'client' | 'workshop' | null;

@Injectable({ providedIn: 'root' })
export class SessionStore {
  readonly selectedPortal = signal<PortalType>(null);
}
