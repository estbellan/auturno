import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  /**
   * Placeholder for Auth0 token validation and profile hydration.
   */
  validateAccessToken(_token: string) {
    return { valid: true };
  }
}
