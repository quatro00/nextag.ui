import { Routes } from '@angular/router';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { roleGuard } from '@/app/domains/auth/guards/role.guard';

const rolesGestion = [
  AUTH_ROLES.ADMINISTRADOR,
  AUTH_ROLES.ADMIN_EMPRESA,
];

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/responsables-list/responsables-list'),
  },
  {
    path: 'nuevo',
    canActivate: [roleGuard],
    data: {
      roles: rolesGestion,
    },
    loadComponent: () =>
      import('./features/responsable-form/responsable-form'),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/responsable-form/responsable-form'),
  },
];

export default routes;