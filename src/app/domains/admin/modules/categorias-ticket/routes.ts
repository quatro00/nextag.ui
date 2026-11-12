import { Routes } from '@angular/router';

import { AUTH_ROLES } from
  '@/app/domains/auth/constants/auth.roles';

import { roleGuard } from
  '@/app/domains/auth/guards/role.guard';

const rolesGestion = [
  AUTH_ROLES.ADMINISTRADOR,
  AUTH_ROLES.ADMIN_EMPRESA,
];

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        './features/categorias-ticket-list/categorias-ticket-list'
      ),
  },
  {
    path: 'nuevo',
    canActivate: [roleGuard],
    data: {
      roles: rolesGestion,
    },
    loadComponent: () =>
      import(
        './features/categoria-ticket-form/categoria-ticket-form'
      ),
  },
  {
    path: ':id',
    canActivate: [roleGuard],
    data: {
      roles: rolesGestion,
    },
    loadComponent: () =>
      import(
        './features/categoria-ticket-form/categoria-ticket-form'
      ),
  },
];

export default routes;