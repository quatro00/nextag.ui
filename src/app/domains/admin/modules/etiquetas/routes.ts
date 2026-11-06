import { Routes } from '@angular/router';
const rutas: Routes = [
  { path: '', loadComponent: () => import('./features/etiquetas-list/etiquetas-list') },
  { path: ':id', loadComponent: () => import('./features/etiqueta-detalle/etiqueta-detalle') },
];
export default rutas;
