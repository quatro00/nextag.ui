export interface TipoMovimientoActivo {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
}

export interface ActivoMovimiento {
  id: string;
  empresaId: string;

  activoId: string;
  activoCodigo: string;
  activoNombre: string;
  activoNumeroSerie: string | null;

  tipoMovimientoActivoId: number;
  tipoMovimientoClave: string;
  tipoMovimientoNombre: string;

  fechaMovimiento: string;
  motivo: string | null;
  observaciones: string | null;

  sucursalOrigenId: string | null;
  ubicacionOrigenId: string | null;
  sucursalOrigenNombre: string | null;
  ubicacionOrigenNombre: string | null;

  esOrigenExterno: boolean;
  origenExternoNombre: string | null;
  origenExternoDireccion: string | null;

  sucursalDestinoId: string | null;
  ubicacionDestinoId: string | null;
  sucursalDestinoNombre: string | null;
  ubicacionDestinoNombre: string | null;

  esDestinoExterno: boolean;
  destinoExternoNombre: string | null;
  destinoExternoDireccion: string | null;
  proveedorDestinoId: string | null;

  movimientoOrigenId: string | null;

  estadoActivoOrigenId: number;
  estadoActivoDestinoId: number;

  tipoReferencia: string | null;
  referenciaId: string | null;

  anulado: boolean;
  fechaAnulacion: string | null;
  usuarioAnulacion: string | null;
  motivoAnulacion: string | null;

  fechaCreacion: string;
  usuarioCreacion: string;
}

export interface ActivoMovimientoCrear {
  activoId: string;
  tipoMovimientoActivoId: number;

  sucursalDestinoId: string | null;
  ubicacionDestinoId: string | null;

  destinoExternoNombre: string | null;
  destinoExternoDireccion: string | null;
  proveedorDestinoId: string | null;

  movimientoOrigenId: string | null;
  estadoActivoDestinoId: number | null;

  motivo: string | null;
  observaciones: string | null;

  tipoReferencia: string | null;
  referenciaId: string | null;
}

export interface ActivoMovimientoFiltro {
  buscar?: string;
  activoId?: string;
  tipoMovimientoActivoId?: number;
  sucursalId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  esDestinoExterno?: boolean;
  anulado?: boolean;
  pagina?: number;
  tamanoPagina?: number;
}

export interface ActivoMovimientoPagina {
  items: ActivoMovimiento[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export interface ActivoSituacion {
  activoId: string;
  activoCodigo: string;
  activoNombre: string;

  estadoActivoId: number;
  estadoActivoNombre: string;

  estaFuera: boolean;

  sucursalId: string;
  sucursalNombre: string;

  ubicacionId: string | null;
  ubicacionNombre: string | null;

  ubicacionExternaNombre: string | null;
  ubicacionExternaDireccion: string | null;

  proveedorExternoId: string | null;

  movimientoSalidaId: string | null;
  fechaSalida: string | null;
}