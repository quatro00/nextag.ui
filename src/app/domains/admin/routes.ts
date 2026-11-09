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
      { path: 'ubicaciones', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA, AUTH_ROLES.OPERADOR, AUTH_ROLES.CONSULTA,], }, loadChildren: () => import('./modules/ubicaciones/routes'), },
      { path: 'categorias-activo', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA, AUTH_ROLES.OPERADOR, AUTH_ROLES.CONSULTA,], }, loadChildren: () => import('./modules/categorias-activo/routes'), },
      { path: 'marcas', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA, AUTH_ROLES.OPERADOR, AUTH_ROLES.CONSULTA,], }, loadChildren: () => import('./modules/marcas/routes'), },
      { path: 'modelos-activo', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA, AUTH_ROLES.OPERADOR, AUTH_ROLES.CONSULTA,], }, loadChildren: () => import('./modules/modelos-activo/routes'), },
      { path: 'proveedores', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA, AUTH_ROLES.OPERADOR, AUTH_ROLES.CONSULTA,], }, loadChildren: () => import('./modules/proveedores/routes'), },
      { path: 'activos', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA, AUTH_ROLES.OPERADOR, AUTH_ROLES.CONSULTA ] }, loadChildren: () => import('./modules/activos/routes') },
      { path: 'etiquetas', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA, AUTH_ROLES.OPERADOR, AUTH_ROLES.CONSULTA] }, loadChildren: () => import('./modules/etiquetas/routes') },
      { path: 'responsables', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA, AUTH_ROLES.OPERADOR, AUTH_ROLES.CONSULTA, ], }, loadChildren: () => import('./modules/responsables/routes'), },
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];

export default routes;
