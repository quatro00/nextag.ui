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
      { path: 'inicio', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR] }, loadChildren: () => import('./modules/home/routes') },
      { path: 'usuarios', canActivate: [roleGuard], data: { roles: [AUTH_ROLES.ADMINISTRADOR], }, loadChildren: () => import('./modules/usuarios/routes'), },
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];

export default routes;
