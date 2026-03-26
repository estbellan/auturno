import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionStore } from '../state/session.store';

export const workshopHomeGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const sessionStore = inject(SessionStore);

  await sessionStore.bootstrap();

  if (sessionStore.status() === 'forbidden') {
    return router.createUrlTree(['/access-denied'], {
      queryParams: {
        from: '/workshop',
      },
    });
  }

  const targetUrl = sessionStore.defaultPortalUrl();
  if (!targetUrl || !targetUrl.startsWith('/workshop')) {
    return router.createUrlTree(['/access-denied'], {
      queryParams: {
        from: '/workshop',
      },
    });
  }

  return router.parseUrl(targetUrl);
};
