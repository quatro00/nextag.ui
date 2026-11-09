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
      import('./features/asignaciones-list/asignaciones-list'),
  },
  {
    path: 'nueva',
    canActivate: [roleGuard],
    data: { roles: rolesGestion },
    loadComponent: () =>
      import('./features/asignacion-form/asignacion-form'),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/asignacion-detalle/asignacion-detalle'),
  },
];

export default routes;