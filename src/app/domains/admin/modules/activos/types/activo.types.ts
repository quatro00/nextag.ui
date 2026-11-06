export interface EstadoActivo {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface ActivoList {
  id: string;
  empresaId: string;
  codigo: string;
  numeroInventario: string | null;
  numeroSerie: string | null;
  nombre: string;
  categoriaActivoId: string;
  categoriaActivoNombre: string;
  marcaId: string | null;
  marcaNombre: string | null;
  modeloActivoId: string | null;
  modeloActivoNombre: string | null;
  sucursalId: string;
  sucursalNombre: string;
  ubicacionId: string | null;
  ubicacionNombre: string | null;
  estadoActivoId: number;
  estadoActivoNombre: string;
  proveedorId: string | null;
  proveedorNombre: string | null;
  tipoPropiedad: string;
}

export interface ActivoDetalle extends ActivoList {
  descripcion: string | null;
  propietarioProveedorId: string | null;
  propietarioProveedorNombre: string | null;
  propietarioNombre: string | null;
  fechaAdquisicion: string | null;
  costoAdquisicion: number | null;
  moneda: string;
  fechaAlta: string;
  fechaBaja: string | null;
  observaciones: string | null;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface ActivoGuardar {
  codigo: string;
  numeroInventario: string | null;
  numeroSerie: string | null;
  nombre: string;
  descripcion: string | null;
  categoriaActivoId: string;
  marcaId: string | null;
  modeloActivoId: string | null;
  sucursalId: string;
  ubicacionId: string | null;
  proveedorId: string | null;
  tipoPropiedad: 'PROPIO' | 'ARRENDADO' | 'COMODATO' | 'TERCERO';
  propietarioProveedorId: string | null;
  propietarioNombre: string | null;
  fechaAdquisicion: string | null;
  costoAdquisicion: number | null;
  moneda: string;
  observaciones: string | null;
}

export interface ActivoFiltros {
  buscar?: string;
  estadoActivoId?: number;
  categoriaActivoId?: string;
  marcaId?: string;
  modeloActivoId?: string;
  sucursalId?: string;
  ubicacionId?: string;
  proveedorId?: string;
  pagina?: number;
  tamanoPagina?: number;
}

export interface ActivoPagina {
  items: ActivoList[];
  total: number;
  pagina: number;
  tamanoPagina: number;
}
