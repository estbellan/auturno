import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: 'client',
    loadChildren: () => import('./client-portal/client-portal.routes').then((m) => m.CLIENT_PORTAL_ROUTES)
  },
  {
    path: 'workshop',
    loadChildren: () => import('./workshop-portal/workshop-portal.routes').then((m) => m.WORKSHOP_PORTAL_ROUTES)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login'
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
