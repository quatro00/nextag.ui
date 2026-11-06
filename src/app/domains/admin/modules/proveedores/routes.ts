import { Routes } from '@angular/router';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { roleGuard } from '@/app/domains/auth/guards/role.guard';

const rolesGestion = [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA];

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/proveedores-list/proveedores-list'),
  },
  {
    path: 'nuevo',
    canActivate: [roleGuard],
    data: { roles: rolesGestion },
    loadComponent: () => import('./features/proveedor-form/proveedor-form'),
  },
  {
    path: ':id',
    // Vista de consulta para OPERADOR/CONSULTA; el formulario se habilita solo con permisos. 
    loadComponent: () => import('./features/proveedor-form/proveedor-form'),
  },
];

export default routes;
