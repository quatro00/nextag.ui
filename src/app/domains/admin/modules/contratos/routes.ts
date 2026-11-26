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

        pathMatch: 'full',

        loadComponent: () =>
            import(
                './features/contratos-list/contratos-list'
            ),
    },

    {
        path: 'nuevo',

        canActivate: [roleGuard],

        data: {
            roles: rolesGestion,
        },

        loadComponent: () =>
            import(
                './features/contrato-form/contrato-form'
            ),
    },

    {
        path: ':id/editar',

        canActivate: [roleGuard],

        data: {
            roles: rolesGestion,
        },

        loadComponent: () =>
            import(
                './features/contrato-form/contrato-form'
            ),
    },

    {
        path: ':id',

        loadComponent: () =>
            import(
                './features/contrato-detalle/contrato-detalle'
            ),
    },

];

export default routes;