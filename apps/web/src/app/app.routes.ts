import { Routes } from '@angular/router';
import { entryRedirectGuard } from './core/guards/entry-redirect.guard';
import { AccessDeniedPageComponent } from './core/pages/access-denied-page.component';
import { EntryRedirectPageComponent } from './core/pages/entry-redirect-page.component';
import { NotFoundPageComponent } from './core/pages/not-found-page.component';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [entryRedirectGuard],
    component: EntryRedirectPageComponent,
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.routes').then((module) => module.AUTH_ROUTES),
  },
  {
    path: 'client',
    loadChildren: () =>
      import('./client-portal/client-portal.routes').then(
        (module) => module.CLIENT_PORTAL_ROUTES,
      ),
  },
  {
    path: 'workshop',
    loadChildren: () =>
      import('./workshop-portal/workshop-portal.routes').then(
        (module) => module.WORKSHOP_PORTAL_ROUTES,
      ),
  },
  {
    path: 'dev/vertical-slice',
    loadComponent: () =>
      import('./features/vertical-slice/vertical-slice.component').then(
        (module) => module.VerticalSliceComponent,
      ),
  },
  {
    path: 'not-found',
    component: NotFoundPageComponent,
  },
  {
    path: 'access-denied',
    component: AccessDeniedPageComponent,
  },
  {
    path: '**',
    component: NotFoundPageComponent,
  },
];
