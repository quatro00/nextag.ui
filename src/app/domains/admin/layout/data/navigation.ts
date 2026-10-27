import { IsActiveMatchOptions } from '@angular/router';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';

export type NavigationItem = {
  id: string;
  label: string;
  description?: string;
  route?: string;
  icon?: string;
  badge?: string;
  roles?: string[];
  children?: NavigationItem[];
  disabled?: boolean;
  expanded?: boolean;
  activeOptions?: { exact: boolean } | IsActiveMatchOptions;
};


export const NAVIGATION: NavigationItem[] = [
  {
    id: 'principal',
    label: 'Principal',
    children: [
      {
        id: 'principal/inicio',
        label: 'Inicio',
        icon: 'house',
        route: '/admin/inicio',
        roles: [AUTH_ROLES.ADMINISTRADOR],
      },
    ],
  },
  {
    id: 'administracion',
    label: 'Administración',
    children: [
      {
        id: 'administracion/usuarios',
        label: 'Usuarios',
        icon: 'users',
        route: '/admin/usuarios',
        roles: [AUTH_ROLES.ADMINISTRADOR],
      },
    ],
  },
];
