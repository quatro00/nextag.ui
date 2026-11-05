import { Routes } from '@angular/router';
import { AUTH_ROLES } from '../auth/constants/auth.roles';
import { roleGuard } from '../auth/guards/role.guard';
import { AdminLayout } from './layout/layout';



const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', loadChildren: () => import('./modules/home/routes') },
      { path: 'usuarios', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR], }, loadChildren: () => import('./modules/usuarios/routes'), },
      { path: 'empresas', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR] }, loadChildren: () => import('./modules/empresas/routes'), },
      { path: 'sucursales', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA, AUTH_ROLES.OPERADOR, AUTH_ROLES.CONSULTA,], }, loadChildren: () => import('./modules/sucursales/routes'), },
      { path: 'tipos-ubicacion', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA, AUTH_ROLES.OPERADOR, AUTH_ROLES.CONSULTA,], }, loadChildren: () => import('./modules/tipos-ubicacion/routes'), },
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];

export default routes;
