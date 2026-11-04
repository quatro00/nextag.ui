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
      import('./features/sucursales-list/sucursales-list'),
  },
  {
    path: 'nuevo',
    canActivate: [roleGuard],
    data: { roles: rolesGestion },
    loadComponent: () =>
      import('./features/sucursal-form/sucursal-form'),
  },
  {
    path: ':id',
    canActivate: [roleGuard],
    data: { roles: rolesGestion },
    loadComponent: () =>
      import('./features/sucursal-form/sucursal-form'),
  },
];

export default routes;