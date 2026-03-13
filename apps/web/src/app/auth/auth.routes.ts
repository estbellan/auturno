import { Routes } from '@angular/router';
import { PublicLayoutComponent } from '../core/layouts/public-layout/public-layout.component';
import { LoginPageComponent } from './pages/login-page.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'login',
        component: LoginPageComponent
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
      }
    ]
  }
];
