import { Routes } from '@angular/router';
const rutas: Routes = [
  { path: '', loadComponent: () => import('./features/etiquetas-list/etiquetas-list') },
  { path: 'configuracion', loadComponent: () => import('./features/etiqueta-configuracion/etiqueta-configuracion'), },
  { path: ':id', loadComponent: () => import('./features/etiqueta-detalle/etiqueta-detalle') },
];
export default rutas;
