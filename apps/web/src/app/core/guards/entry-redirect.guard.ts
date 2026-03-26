import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../auth.service';
import { SessionStore } from '../state/session.store';

export const entryRedirectGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const sessionStore = inject(SessionStore);

  await sessionStore.bootstrap();

  if (sessionStore.status() === 'forbidden') {
    return router.createUrlTree(['/access-denied'], {
      queryParams: {
        from: authService.consumeReturnUrl() ?? '/',
      },
    });
  }

  const returnUrl = sessionStore.resolveReturnUrl(authService.consumeReturnUrl());
  if (returnUrl) {
    return router.parseUrl(returnUrl);
  }

  return router.parseUrl(sessionStore.defaultPortalUrl() ?? '/auth/login');
};
