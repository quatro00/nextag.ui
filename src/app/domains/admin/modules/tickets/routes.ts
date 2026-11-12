import { Routes } from '@angular/router';

import { AUTH_ROLES } from
  '@/app/domains/auth/constants/auth.roles';

import { roleGuard } from
  '@/app/domains/auth/guards/role.guard';

const rolesOperacion = [
  AUTH_ROLES.ADMINISTRADOR,
  AUTH_ROLES.ADMIN_EMPRESA,
  AUTH_ROLES.OPERADOR,
];

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/tickets-list/tickets-list'),
  },
  {
    path: 'nuevo',
    canActivate: [roleGuard],
    data: {
      roles: rolesOperacion,
    },
    loadComponent: () =>
      import('./features/ticket-form/ticket-form'),
  },
  {
    path: ':id/editar',
    canActivate: [roleGuard],
    data: {
      roles: rolesOperacion,
    },
    loadComponent: () =>
      import('./features/ticket-form/ticket-form'),
  },
];

export default routes;