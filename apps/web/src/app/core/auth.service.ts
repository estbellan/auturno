import { Injectable, inject } from '@angular/core';
import { AuthService as Auth0AngularService } from '@auth0/auth0-angular';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth0 = inject(Auth0AngularService);

  async login(): Promise<void> {
    await this.auth0.loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: environment.auth0Audience,
      },
    });
  }

  async signup(): Promise<void> {
    await this.auth0.loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: environment.auth0Audience,
        screen_hint: 'signup',
      },
    });
  }

  async logout(): Promise<void> {
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
}