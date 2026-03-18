import { Routes } from '@angular/router';
import { LoginPageComponent } from './auth/pages/login-page.component';
import { VerticalSliceComponent } from './features/vertical-slice/vertical-slice.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: VerticalSliceComponent,
  },
  {
    path: 'auth/login',
    component: LoginPageComponent,
  },
  {
    path: 'workshop',
    loadChildren: () =>
      import('./workshop-portal/workshop-portal.routes').then(
        (module) => module.WORKSHOP_PORTAL_ROUTES,
      ),
  },
];
