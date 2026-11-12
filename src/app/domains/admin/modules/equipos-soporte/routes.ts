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
        './features/equipos-soporte-list/equipos-soporte-list'
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
        './features/equipo-soporte-form/equipo-soporte-form'
      ),
  },
  {
    path: ':id/integrantes',
    loadComponent: () =>
      import(
        './features/equipo-soporte-integrantes/equipo-soporte-integrantes'
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
        './features/equipo-soporte-form/equipo-soporte-form'
      ),
  },
];

export default routes;