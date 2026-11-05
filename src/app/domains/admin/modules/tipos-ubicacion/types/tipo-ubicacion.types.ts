export interface TipoUbicacionList {
  id: string;
  empresaId: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface TipoUbicacionDetalle extends TipoUbicacionList {
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface TipoUbicacionCreate {
  clave: string;
  nombre: string;
  descripcion: string | null;
}

export type TipoUbicacionUpdate = TipoUbicacionCreate;

export interface TipoUbicacionEstatus {
  activo: boolean;
}