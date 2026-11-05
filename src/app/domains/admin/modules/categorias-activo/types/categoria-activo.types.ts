export interface CategoriaActivoList {
  id: string;
  empresaId: string;

  categoriaPadreId: string | null;
  categoriaPadreNombre: string | null;

  clave: string;
  nombre: string;
  descripcion: string | null;

  activo: boolean;
}

export interface CategoriaActivoDetalle extends CategoriaActivoList {
  fechaCreacion: string;
  usuarioCreacion: string;

  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface CategoriaActivoCreate {
  categoriaPadreId: string | null;

  clave: string;
  nombre: string;
  descripcion: string | null;
}

export type CategoriaActivoUpdate = CategoriaActivoCreate;

export interface CategoriaActivoEstatus {
  activo: boolean;
}

/**
 * Modelo utilizado únicamente para representar
 * las categorías en forma de árbol.
 */
export interface CategoriaActivoFilaArbol extends CategoriaActivoList {
  nivel: number;
  tieneHijos: boolean;
}