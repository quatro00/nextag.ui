export type TipoEquipoSoporte =
  | 'INTERNO'
  | 'EXTERNO'
  | 'MIXTO';

export interface EquipoSoporteList {

  id: string;
  empresaId: string;

  clave: string;
  nombre: string;
  descripcion: string | null;

  tipo: TipoEquipoSoporte;

  proveedorId: string | null;
  proveedorNombre: string | null;

  correoContacto: string | null;

  activo: boolean;

  totalIntegrantes: number;
}

export interface EquipoSoporteDetalle
  extends EquipoSoporteList {

  fechaCreacion: string;
  usuarioCreacion: string;

  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface EquipoSoporteGuardar {

  clave: string;
  nombre: string;
  descripcion: string | null;

  tipo: TipoEquipoSoporte;

  proveedorId: string | null;

  correoContacto: string | null;
}

export interface EquipoSoporteFiltros {
  activo?: boolean;
  tipo?: TipoEquipoSoporte;
  buscar?: string;
}