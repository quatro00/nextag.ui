import { Routes } from '@angular/router';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { roleGuard } from '@/app/domains/auth/guards/role.guard';

const rutas: Routes = [
  { path: '', loadComponent: () => import('./features/activos-list/activos-list') },
  {
    path: 'nuevo', canActivate: [roleGuard],
    data: { roles: [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA] },
    loadComponent: () => import('./features/activo-form/activo-form'),
  },
  { path: ':id', loadComponent: () => import('./features/activo-form/activo-form') },
];
export default rutas;
