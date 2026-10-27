import { Route } from '@angular/router';
import { authGuard } from './domains/auth/guards/auth.guard';

export const routes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/sign-in' },
  { path: 'auth', loadChildren: () => import('./domains/auth/routes') },
  { path: 'admin',canActivate: [authGuard], loadChildren: () => import('./domains/admin/routes') },
  { path: '**', redirectTo: 'auth/sign-in' },
];
