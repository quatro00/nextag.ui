export interface ActivoAsignacion {
  id: string;
  empresaId: string;

  activoId: string;
  activoCodigo: string;
  activoNombre: string;
  activoNumeroSerie: string | null;
  activoNumeroInventario: string | null;

  sucursalId: string;
  sucursalNombre: string;
  ubicacionId: string | null;
  ubicacionNombre: string | null;

  responsableId: string;
  responsableNombre: string;
  responsableTipo: 'PERSONA' | 'AREA';
  responsableCodigo: string | null;

  areaResponsableId: string | null;
  areaResponsableNombre: string | null;

  fechaAsignacion: string;
  motivoAsignacion: string | null;
  observacionesAsignacion: string | null;

  fechaDevolucion: string | null;
  motivoDevolucion: string | null;
  condicionDevolucion: string | null;
  observacionesDevolucion: string | null;

  usuarioDevolucion: string | null;

  vigente: boolean;

  fechaCreacion: string;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface ActivoAsignacionCrear {
  activoId: string;
  responsableId: string;
  fechaAsignacion: string | null;
  motivoAsignacion: string | null;
  observacionesAsignacion: string | null;
}

export interface ActivoAsignacionDevolver {
  fechaDevolucion: string | null;
  motivoDevolucion: string | null;
  condicionDevolucion: string | null;
  observacionesDevolucion: string | null;
}

export interface ActivoAsignacionReasignar {
  nuevoResponsableId: string;
  fechaReasignacion: string | null;
  motivo: string | null;
  condicionDevolucion: string | null;
  observacionesDevolucion: string | null;
  observacionesAsignacion: string | null;
}

export interface ActivoAsignacionFiltro {
  buscar?: string;
  activoId?: string;
  responsableId?: string;
  sucursalId?: string;
  tipoResponsable?: 'PERSONA' | 'AREA';
  vigente?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  pagina?: number;
  tamanoPagina?: number;
}

export interface ActivoAsignacionPagina {
  items: ActivoAsignacion[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export interface ActivoSinAsignar {
  id: string;
  codigo: string;
  nombre: string;
  numeroSerie: string | null;
  numeroInventario: string | null;
  sucursalId: string;
  sucursalNombre: string;
  ubicacionId: string | null;
  ubicacionNombre: string | null;
  estadoActivoId: number;
  estadoActivoNombre: string;
}

export interface ActivosSinAsignarPagina {
  items: ActivoSinAsignar[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}