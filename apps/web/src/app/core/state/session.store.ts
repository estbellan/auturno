import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { getDefaultWorkshopRoute, hasRequiredPermissions, type AppPermission } from '../access/workshop-access.config';
import { ApiService, CurrentUserViewModel } from '../api.service';
import { AuthService } from '../auth.service';
export type PortalType = 'client' | 'workshop' | null;
export type SessionStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'anonymous'
  | 'forbidden'
  | 'error';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);
  private bootstrapPromise: Promise<void> | null = null;

  readonly status = signal<SessionStatus>('idle');
  readonly currentUser = signal<CurrentUserViewModel | null>(null);
  readonly error = signal<string | null>(null);
  readonly selectedPortal = signal<PortalType>(null);

  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isBootstrapping = computed(() => this.status() === 'loading');

  async bootstrap(force = false): Promise<void> {
    if (!force) {
      if (this.status() === 'authenticated' || this.status() === 'anonymous') {
        return;
      }

      if (this.bootstrapPromise) {
        await this.bootstrapPromise;
        return;
      }
    }

    this.status.set('loading');
    this.error.set(null);
    this.bootstrapPromise = this.runBootstrap();

    try {
      await this.bootstrapPromise;
    } finally {
      this.bootstrapPromise = null;
    }
  }

  clearSession(): void {
    this.status.set('anonymous');
    this.currentUser.set(null);
    this.error.set(null);
    this.selectedPortal.set(null);
  }

  setAccessDenied(
    message = 'Your session is authenticated, but access is not allowed.',
    preserveCurrentUser = false,
  ): void {
    this.status.set('forbidden');
    if (!preserveCurrentUser) {
      this.currentUser.set(null);
    }
    this.error.set(message);
    this.selectedPortal.set(null);
  }

  canAccessPortal(portal: Exclude<PortalType, null>): boolean {
    const user = this.currentUser();

    if (!user) {
      return false;
    }

    if (portal === 'client') {
      return user.roles.includes('client');
    }

    return user.permissions.length > 0;
  }

  hasPermissions(requiredPermissions: AppPermission[] = []): boolean {
    return hasRequiredPermissions(this.currentUser(), requiredPermissions);
  }

  resolveReturnUrl(candidate: string | null): string | null {
    if (!candidate || !candidate.startsWith('/')) {
      return null;
    }

    if (candidate.startsWith('/auth')) {
      return null;
    }

    if (candidate.startsWith('/client')) {
      return this.canAccessPortal('client') ? candidate : this.defaultPortalUrl();
    }

    if (candidate.startsWith('/workshop')) {
      return this.canAccessPortal('workshop') ? candidate : this.defaultPortalUrl();
    }

    if (candidate.startsWith('/access-denied') || candidate === '/') {
      return this.defaultPortalUrl();
    }

    return null;
  }

  defaultPortalUrl(): string | null {
    const user = this.currentUser();

    if (!user) {
      return null;
    }

    if (user.permissions.length > 0) {
      if (!user.workshopId) {
        return '/workshop/setup';
      }
      return getDefaultWorkshopRoute(user);
    }

    if (user.roles.includes('client')) {
      return '/client';
    }

    return null;
  }

  setSelectedPortal(portal: PortalType): void {
    this.selectedPortal.set(portal);
  }

  private async runBootstrap(): Promise<void> {
    await this.authService.waitUntilReady();

    const isAuthenticated = await this.authService.isAuthenticated();
    if (!isAuthenticated) {
      this.clearSession();
      return;
    }

    try {
      const user = this.normalizeCurrentUser(await this.apiService.getMe());
      this.currentUser.set(user);
      this.status.set('authenticated');
      this.selectedPortal.set(
        user.permissions.length > 0
          ? 'workshop'
          : user.roles.includes('client')
            ? 'client'
            : null,
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.clearSession();
        return;
      }

      if (error instanceof HttpErrorResponse && error.status === 403) {
        this.setAccessDenied();
        return;
      }

      this.setAccessDenied('Failed to bootstrap the current session.');
    }
  }

  private normalizeCurrentUser(user: CurrentUserViewModel): CurrentUserViewModel {
    return {
      ...user,
      roles: Array.isArray(user.roles) ? user.roles : [],
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    };
  }
}
