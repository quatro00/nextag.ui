import { Routes } from '@angular/router';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { roleGuard } from '@/app/domains/auth/guards/role.guard';

const rolesGestion = [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA];

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/marcas-list/marcas-list'),
  },
  {
    path: 'nuevo',
    canActivate: [roleGuard],
    data: { roles: rolesGestion },
    loadComponent: () => import('./features/marca-form/marca-form'),
  },
  {
    path: ':id',
    canActivate: [roleGuard],
    data: { roles: rolesGestion },
    loadComponent: () => import('./features/marca-form/marca-form'),
  },
];

export default routes;
