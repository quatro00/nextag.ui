export interface TipoContratoList {
  id: string;
  empresaId: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface TipoContratoDetalle extends TipoContratoList {
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface TipoContratoGuardar {
  clave: string;
  nombre: string;
  descripcion: string | null;
}

export interface TipoContratoFiltros {
  activo?: boolean;
  buscar?: string;
}