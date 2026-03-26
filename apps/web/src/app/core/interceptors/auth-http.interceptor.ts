import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { ApiClientService } from '../api/api-client.service';
import { AuthService } from '../auth.service';
import { SessionStore } from '../state/session.store';

export const authHttpInterceptor: HttpInterceptorFn = (request, next) => {
  const apiClient = inject(ApiClientService);
  const authService = inject(AuthService);
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  if (!apiClient.isApiUrl(request.url)) {
    return next(request);
  }

  return from(authService.getAccessToken()).pipe(
    switchMap((token) => {
      const authorizedRequest =
        token && !request.headers.has('Authorization')
          ? request.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`,
              },
            })
          : request;

      return next(authorizedRequest).pipe(
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            sessionStore.clearSession();

            if (!router.url.startsWith('/auth/login')) {
              void router.navigate(['/auth/login'], {
                queryParams: {
                  returnUrl: router.url,
                },
              });
            }
          }

          if (error instanceof HttpErrorResponse && error.status === 403) {
            sessionStore.setAccessDenied(
              'Your session is authenticated, but this action is not allowed.',
              true,
            );

            if (!router.url.startsWith('/access-denied')) {
              void router.navigate(['/access-denied'], {
                queryParams: {
                  from: router.url,
                },
              });
            }
          }

          return throwError(() => error);
        }),
      );
    }),
  );
};
