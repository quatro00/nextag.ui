export interface SucursalList {
  id: string;
  empresaId: string;
  clave: string;
  nombre: string;
  municipio: string | null;
  estado: string | null;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
}

export interface SucursalDetalle extends SucursalList {
  descripcion: string | null;
  direccion: string | null;
  colonia: string | null;
  codigoPostal: string | null;
  pais: string | null;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface SucursalCreate {
  clave: string;
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
  codigoPostal: string | null;
  pais: string | null;
  telefono: string | null;
  correo: string | null;
}

export type SucursalUpdate = SucursalCreate;

export interface SucursalEstatus {
  activo: boolean;
}