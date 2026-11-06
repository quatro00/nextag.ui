export type EstatusEtiqueta = 'DISPONIBLE' | 'VINCULADA' | 'RETIRADA';

export interface Etiqueta {
  id: string;
  empresaId: string;
  codigo: string;
  tokenPublico: string;
  urlPublica: string | null;
  uidNfc: string | null;
  tieneNfc: boolean;
  tieneQr: boolean;
  esAntimetal: boolean;
  nfcBloqueado: boolean;
  anulada: boolean;
  fechaAnulacion: string | null;
  motivoAnulacion: string | null;
  estatus: EstatusEtiqueta;
  activoId: string | null;
  activoCodigo: string | null;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface EtiquetaFiltros {
  buscar?: string;
  estatus?: EstatusEtiqueta;
  tieneNfc?: boolean;
  tieneQr?: boolean;
  pagina?: number;
  tamanoPagina?: number;
}

export interface EtiquetaPagina {
  items: Etiqueta[];
  total: number;
  pagina: number;
  tamanoPagina: number;
}

export interface EtiquetaGenerar {
  cantidad: number;
  tieneNfc: boolean;
  tieneQr: boolean;
  esAntimetal: boolean;
}

export interface EtiquetaNfcActualizar {
  uidNfc: string | null;
  nfcBloqueado: boolean | null;
  confirmoVerificacionFisica: boolean;
}

export interface ActivoEtiquetaHistorial {
  id: string;
  activoId: string;
  etiquetaId: string;
  etiquetaCodigo: string;
  tokenPublico: string;
  urlPublica: string | null;
  tieneNfc: boolean;
  tieneQr: boolean;
  esAntimetal: boolean;
  nfcBloqueado: boolean;
  anulada: boolean;
  vigente: boolean;
  fechaVinculacion: string;
  usuarioVinculacion: string;
  fechaDesvinculacion: string | null;
  usuarioDesvinculacion: string | null;
  motivoDesvinculacion: string | null;
}
