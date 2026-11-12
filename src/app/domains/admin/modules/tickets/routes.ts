import { Routes } from '@angular/router';

import { AUTH_ROLES } from
  '@/app/domains/auth/constants/auth.roles';

import { roleGuard } from
  '@/app/domains/auth/guards/role.guard';

const rolesOperacion = [
  AUTH_ROLES.ADMINISTRADOR,
  AUTH_ROLES.ADMIN_EMPRESA,
  AUTH_ROLES.OPERADOR,
];

const routes: Routes = [

  // ==========================================
  // LISTADO GENERAL
  // ==========================================

  {
    path: '',
    loadComponent: () =>
      import('./features/tickets-list/tickets-list'),
  },

  // ==========================================
  // MIS TICKETS
  // ==========================================

  {
    path: 'mis-tickets',
    canActivate: [roleGuard],
    data: {
      roles: rolesOperacion,
      bandeja: 'MIS_TICKETS',
    },
    loadComponent: () =>
      import('./features/tickets-bandeja/tickets-bandeja'),
  },

  // ==========================================
  // TICKETS DE MIS EQUIPOS
  // ==========================================

  {
    path: 'mis-equipos',
    canActivate: [roleGuard],
    data: {
      roles: rolesOperacion,
      bandeja: 'MIS_EQUIPOS',
    },
    loadComponent: () =>
      import('./features/tickets-bandeja/tickets-bandeja'),
  },

  // ==========================================
  // CREAR
  // ==========================================

  {
    path: 'nuevo',
    canActivate: [roleGuard],
    data: {
      roles: rolesOperacion,
    },
    loadComponent: () =>
      import('./features/ticket-form/ticket-form'),
  },

  // ==========================================
  // EDITAR
  // ==========================================

  {
    path: ':id/editar',
    canActivate: [roleGuard],
    data: {
      roles: rolesOperacion,
    },
    loadComponent: () =>
      import('./features/ticket-form/ticket-form'),
  },

  // ==========================================
  // DETALLE
  // ==========================================

  {
    path: ':id',
    loadComponent: () =>
      import('./features/ticket-detalle/ticket-detalle'),
  },

];

export default routes;