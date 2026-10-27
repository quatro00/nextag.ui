import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'sign-in' },
      { path: 'sign-in', loadComponent: () => import('./features/sign-in/sign-in') },
    ],
  },
];

export default routes;
