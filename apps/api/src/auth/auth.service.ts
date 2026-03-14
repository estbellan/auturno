import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AuthClaims } from './types';

@Injectable()
export class AuthService {
  private readonly issuer = process.env.AUTH0_ISSUER_BASE_URL;
  private readonly audience = process.env.AUTH0_AUDIENCE;
  private readonly bypass = process.env.AUTH0_BYPASS === 'true';

  async verifyToken(bearerToken: string): Promise<AuthClaims> {
    if (this.bypass) {
      return {
        sub: process.env.AUTH0_BYPASS_SUB ?? 'auth0|dev-user',
        email: process.env.AUTH0_BYPASS_EMAIL ?? 'owner@auturno.dev',
        name: process.env.AUTH0_BYPASS_NAME ?? 'Dev Owner',
      };
    }

    if (!this.issuer || !this.audience) {
      throw new UnauthorizedException(
        'Auth0 is not configured. Set AUTH0_ISSUER_BASE_URL and AUTH0_AUDIENCE.',
      );
    }

    try {
      const jwks = createRemoteJWKSet(
        new URL(`${this.issuer.replace(/\/$/, '')}/.well-known/jwks.json`),
      );

      const { payload } = await jwtVerify(bearerToken, jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      return {
        sub: String(payload.sub),
        email: payload.email ? String(payload.email) : undefined,
        name: payload.name ? String(payload.name) : undefined,
      };
    } catch {
      throw new UnauthorizedException('Invalid Auth0 token.');
    }
  }
}
