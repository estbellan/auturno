import { Injectable, inject } from '@angular/core';
import { AuthService as Auth0AngularService } from '@auth0/auth0-angular';
import { filter, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth0 = inject(Auth0AngularService);
  private readonly returnUrlStorageKey = 'auturno:return-url';

  async login(returnTo = '/'): Promise<void> {
    this.storeReturnUrl(returnTo);
    await this.auth0.loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: environment.auth0Audience,
      },
    });
  }

  async signup(returnTo = '/'): Promise<void> {
    this.storeReturnUrl(returnTo);
    await this.auth0.loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: environment.auth0Audience,
        screen_hint: 'signup',
      },
    });
  }

  async changePassword(): Promise<void> {
    this.storeReturnUrl(window.location.pathname);
    await this.auth0.loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: environment.auth0Audience,
        prompt: 'login',
      },
    });
  }

  async logout(): Promise<void> {
    this.clearReturnUrl();
    this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await firstValueFrom(
        this.auth0.getAccessTokenSilently({
          authorizationParams: {
            audience: environment.auth0Audience,
          },
        }),
      );
    } catch (error) {
      console.error('Failed to get Auth0 access token', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return await firstValueFrom(this.auth0.isAuthenticated$);
  }

  async waitUntilReady(): Promise<void> {
    await firstValueFrom(
      this.auth0.isLoading$.pipe(filter((isLoading) => !isLoading)),
    );
  }

  consumeReturnUrl(): string | null {
    const value = window.sessionStorage.getItem(this.returnUrlStorageKey);
    this.clearReturnUrl();
    return value;
  }

  private storeReturnUrl(returnTo: string): void {
    if (!returnTo.startsWith('/')) {
      return;
    }

    window.sessionStorage.setItem(this.returnUrlStorageKey, returnTo);
  }

  private clearReturnUrl(): void {
    window.sessionStorage.removeItem(this.returnUrlStorageKey);
  }
}
