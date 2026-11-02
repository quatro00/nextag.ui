import { Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadComponent: () => import('./features/empresas-list/empresas-list') },
  { path: 'nuevo', loadComponent: () => import('./features/empresa-form/empresa-form') },
  { path: ':id', loadComponent: () => import('./features/empresa-form/empresa-form') },
];

export default routes;