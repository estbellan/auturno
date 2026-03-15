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
];
