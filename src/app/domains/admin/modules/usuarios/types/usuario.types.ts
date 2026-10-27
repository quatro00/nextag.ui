export interface UsuarioList {
  id: string;
  aspNetUserId: string;
  nombre: string;
  apellidos: string;
  email: string;
  activo: boolean;
  fechaUltimoAcceso: string | null;
  roles: string[];
}

export interface UsuarioDetalle {
  id: string;
  aspNetUserId: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  celular: string | null;
  pais: string | null;
  codigoPais: string | null;
  empresa: string | null;
  dominioPrincipal: string | null;
  activo: boolean;
  fechaUltimoAcceso: string | null;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  roles: string[];
}

export interface UsuarioCreate {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  telefono: string | null;
  celular: string | null;
  pais: string | null;
  codigoPais: string | null;
  empresa: string | null;
  dominioPrincipal: string | null;
  roles: string[];
}

export interface UsuarioUpdate {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  celular: string | null;
  pais: string | null;
  codigoPais: string | null;
  empresa: string | null;
  dominioPrincipal: string | null;
}

export interface UsuarioEstatus {
  activo: boolean;
}

export interface UsuarioRoles {
  roles: string[];
}