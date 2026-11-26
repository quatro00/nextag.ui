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
      import(
        './features/clientes-list/clientes-list'
      ),
  },

  {
    path: 'nuevo',

    canActivate: [
      roleGuard,
    ],

    data: {
      roles: rolesGestion,
    },

    loadComponent: () =>
      import(
        './features/cliente-form/cliente-form'
      ),
  },

  {
    path: ':id',

    loadComponent: () =>
      import(
        './features/cliente-form/cliente-form'
      ),
  },

];

export default routes;