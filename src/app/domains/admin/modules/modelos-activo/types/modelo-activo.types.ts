export interface ModeloActivoList {
  id: string;
  empresaId: string;
  marcaId: string;
  marcaNombre: string;
  categoriaActivoId: string;
  categoriaActivoNombre: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface ModeloActivoDetalle extends ModeloActivoList {
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface ModeloActivoCreate {
  marcaId: string;
  categoriaActivoId: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
}

export type ModeloActivoUpdate = ModeloActivoCreate;

export interface ModelosActivoFiltros {
  marcaId?: string;
  categoriaActivoId?: string;
  activo?: boolean;
}
