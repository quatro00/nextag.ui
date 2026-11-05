export interface MarcaList {
  id: string;
  empresaId: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface MarcaDetalle extends MarcaList {
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface MarcaCreate {
  clave: string;
  nombre: string;
  descripcion: string | null;
}

export type MarcaUpdate = MarcaCreate;
