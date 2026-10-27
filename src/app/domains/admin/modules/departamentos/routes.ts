import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/departamentos-list/departamentos-list'),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./features/departamento-form/departamento-form'),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/departamento-form/departamento-form'),
  },
];

export default routes;