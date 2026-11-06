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
      },
    ],
  },
  {
    id: 'catalogos',
    label: 'Catálogos',
    children: [
      {
        id: 'catalogos/sucursales',
        label: 'Sucursales',
        icon: 'building-2',
        route: '/admin/sucursales',
        roles: [
          AUTH_ROLES.ADMINISTRADOR,
          AUTH_ROLES.ADMIN_EMPRESA,
          AUTH_ROLES.OPERADOR,
          AUTH_ROLES.CONSULTA,
        ],
      },
      {
        id: 'catalogos/tipos-ubicacion',
        label: 'Tipos de ubicación',
        icon: 'tags',
        route: '/admin/tipos-ubicacion',
        roles: [
          AUTH_ROLES.ADMINISTRADOR,
          AUTH_ROLES.ADMIN_EMPRESA,
          AUTH_ROLES.OPERADOR,
          AUTH_ROLES.CONSULTA,
        ],
      },
      {
        id: 'catalogos/ubicaciones',
        label: 'Ubicaciones',
        icon: 'map-pin',
        route: '/admin/ubicaciones',
        roles: [
          AUTH_ROLES.ADMINISTRADOR,
          AUTH_ROLES.ADMIN_EMPRESA,
          AUTH_ROLES.OPERADOR,
          AUTH_ROLES.CONSULTA,
        ],
      },
      {
        id: 'catalogos/categorias-activo',
        label: 'Categorías de activos',
        icon: 'folder-tree',
        route: '/admin/categorias-activo',
        roles: [
          AUTH_ROLES.ADMINISTRADOR,
          AUTH_ROLES.ADMIN_EMPRESA,
          AUTH_ROLES.OPERADOR,
          AUTH_ROLES.CONSULTA,
        ],
      },
      {
        id: 'catalogos/marcas',
        label: 'Marcas',
        icon: 'tags',
        route: '/admin/marcas',
        roles: [
          AUTH_ROLES.ADMINISTRADOR,
          AUTH_ROLES.ADMIN_EMPRESA,
          AUTH_ROLES.OPERADOR,
          AUTH_ROLES.CONSULTA,
        ],
      },
      {
        id: 'catalogos/modelos-activo',
        label: 'Modelos de activos',
        icon: 'package',
        route: '/admin/modelos-activo',
        roles: [
          AUTH_ROLES.ADMINISTRADOR,
          AUTH_ROLES.ADMIN_EMPRESA,
          AUTH_ROLES.OPERADOR,
          AUTH_ROLES.CONSULTA,
        ],
      },
      {
        id: 'catalogos/proveedores',
        label: 'Proveedores',
        icon: 'package',
        route: '/admin/proveedores',
        roles: [
          AUTH_ROLES.ADMINISTRADOR,
          AUTH_ROLES.ADMIN_EMPRESA,
          AUTH_ROLES.OPERADOR,
          AUTH_ROLES.CONSULTA,
        ],
      },
    ],
  },
  {
    id: 'administracion',
    label: 'Administración',
    children: [
      {
        id: 'administracion/empresas',
        label: 'Empresas',
        icon: 'building-2',
        route: '/admin/empresas',
        roles: [AUTH_ROLES.ADMINISTRADOR],
      },
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
