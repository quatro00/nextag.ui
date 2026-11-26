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
        './features/tipos-contrato-list/tipos-contrato-list'
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
        './features/tipo-contrato-form/tipo-contrato-form'
      ),
  },

  {
    path: ':id',

    loadComponent: () =>
      import(
        './features/tipo-contrato-form/tipo-contrato-form'
      ),
  },

];

export default routes;