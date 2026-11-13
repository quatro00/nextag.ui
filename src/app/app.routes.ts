import { Route } from '@angular/router';
import { authGuard } from './domains/auth/guards/auth.guard';

export const routes: Route[] = [

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/sign-in',
  },

  // ==========================================
  // TICKET PUBLICO DESDE NFC/QR
  // ==========================================

  {
    path: 'e/:tokenPublico/ticket',
    loadComponent: () =>
      import('./domains/publico/features/ticket-publico/ticket-publico'),
  },

  // ==========================================
  // FICHA PUBLICA DEL ACTIVO
  // ==========================================

  {
    path: 'e/:tokenPublico',
    loadComponent: () =>
      import('./domains/publico/features/ficha-activo/ficha-activo'),
  },

  // ==========================================
  // AUTENTICACION
  // ==========================================

  {
    path: 'auth',
    loadChildren: () =>
      import('./domains/auth/routes'),
  },

  // ==========================================
  // ADMINISTRACION
  // ==========================================

  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./domains/admin/routes'),
  },

  {
    path: '**',
    redirectTo: 'auth/sign-in',
  },

];