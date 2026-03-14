import { Injectable } from '@angular/core';
import createAuth0Client, { Auth0Client } from '@auth0/auth0-spa-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private client: Auth0Client | null = null;

  private async getClient(): Promise<Auth0Client> {
    if (this.client) {
      return this.client;
    }

    this.client = await createAuth0Client({
      domain: environment.auth0Domain,
      clientId: environment.auth0ClientId,
      authorizationParams: {
        audience: environment.auth0Audience,
        redirect_uri: window.location.origin,
      },
      cacheLocation: 'localstorage',
    });

    if (window.location.search.includes('code=')) {
      await this.client.handleRedirectCallback();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return this.client;
  }

  async login(): Promise<void> {
    const client = await this.getClient();
    await client.loginWithRedirect();
  }

  async logout(): Promise<void> {
    const client = await this.getClient();
    await client.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  async getAccessToken(): Promise<string | null> {
    const client = await this.getClient();
    const isAuthenticated = await client.isAuthenticated();
    if (!isAuthenticated) {
      return null;
    }

    return client.getTokenSilently();
  }
}
