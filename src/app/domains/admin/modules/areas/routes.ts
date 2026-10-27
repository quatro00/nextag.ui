import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/areas-list/areas-list'),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./features/area-form/area-form'),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/area-form/area-form'),
  },
];

export default routes;