import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AppPermission } from '../access/workshop-access.config';
import { SessionStore } from '../state/session.store';

export const portalAccessGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const sessionStore = inject(SessionStore);

  await sessionStore.bootstrap();

  if (sessionStore.status() === 'forbidden') {
    return router.createUrlTree(['/access-denied'], {
      queryParams: {
        from: state.url,
      },
    });
  }

  if (!sessionStore.currentUser()) {
    const returnUrl = sessionStore.resolveReturnUrl(state.url) ?? state.url;
    window.sessionStorage.setItem('auturno:return-url', returnUrl);

    return router.createUrlTree(['/auth/login'], {
      queryParams: {
        returnUrl,
      },
    });
  }

  const requiredPortal = getRouteDataValue(route, 'portal') as
    | 'client'
    | 'workshop'
    | undefined;

  if (requiredPortal && !sessionStore.canAccessPortal(requiredPortal)) {
    return router.createUrlTree(['/access-denied'], {
      queryParams: {
        from: state.url,
      },
    });
  }

  const requiredPermissions = getRouteDataValue(
    route,
    'requiredPermissions',
  ) as AppPermission[] | undefined;

  if (requiredPermissions?.length && !sessionStore.hasPermissions(requiredPermissions)) {
    return router.createUrlTree(['/access-denied'], {
      queryParams: {
        from: state.url,
      },
    });
  }

  sessionStore.setSelectedPortal(requiredPortal ?? sessionStore.selectedPortal());
  return true;
};

function getRouteDataValue(
  route: ActivatedRouteSnapshot,
  key: string,
): unknown {
  for (const snapshot of [...route.pathFromRoot].reverse()) {
    if (snapshot.data && key in snapshot.data) {
      return snapshot.data[key];
    }
  }

  return undefined;
}
