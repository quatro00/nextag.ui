import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/usuarios-list/usuarios-list'),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./features/usuario-form/usuario-form'),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/usuario-form/usuario-form'),
  },
];

export default routes;