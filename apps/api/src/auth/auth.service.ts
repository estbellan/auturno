import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AuthClaims } from './types';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  async verifyToken(bearerToken: string): Promise<AuthClaims> {
    const issuer = this.configService.get<string>('AUTH0_ISSUER_BASE_URL');
    const audience = this.configService.get<string>('AUTH0_AUDIENCE');
    const bypass = this.configService.get<string>('AUTH0_BYPASS') === 'true';

    if (bypass) {
      return {
        sub: this.configService.get<string>('AUTH0_BYPASS_SUB') ?? 'auth0|dev-user',
        email: this.configService.get<string>('AUTH0_BYPASS_EMAIL') ?? 'owner@auturno.dev',
        name: this.configService.get<string>('AUTH0_BYPASS_NAME') ?? 'Dev Owner',
      };
    }

    if (!issuer || !audience) {
      throw new UnauthorizedException(
        'Auth0 is not configured. Set AUTH0_ISSUER_BASE_URL and AUTH0_AUDIENCE.',
      );
    }

    try {
      const normalizedIssuer = issuer.replace(/\/$/, '');
      const jwks = createRemoteJWKSet(
        new URL(`${normalizedIssuer}/.well-known/jwks.json`),
      );

      const { payload } = await jwtVerify(bearerToken, jwks, {
        issuer: issuer,
        audience: audience,
      });

      let email = payload.email ? String(payload.email) : undefined;
      let name = payload.name ? String(payload.name) : undefined;

      if (!email) {
        const userInfo = await this.fetchUserInfo(bearerToken, normalizedIssuer);
        email = userInfo.email ?? email;
        name = userInfo.name ?? name;
      }

      return {
        sub: String(payload.sub),
        email,
        name,
      };
    } catch (error) {
      console.error('Auth0 token validation failed', {
        issuer,
        audience,
        error,
      });

      throw new UnauthorizedException('Invalid Auth0 token.');
    }
  }

  private async fetchUserInfo(
    token: string,
    issuer: string,
  ): Promise<{ email?: string; name?: string }> {
    try {
      const response = await fetch(`${issuer}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return {};
      }

      const data = (await response.json()) as Record<string, unknown>;
      return {
        email: typeof data.email === 'string' ? data.email : undefined,
        name: typeof data.name === 'string' ? data.name : undefined,
      };
    } catch {
      return {};
    }
  }
}