export type TipoResponsable = 'PERSONA' | 'AREA';

export interface Responsable {
  id: string;
  empresaId: string;

  tipo: TipoResponsable;
  nombre: string;
  codigo: string | null;

  puesto: string | null;
  departamento: string | null;

  sucursalId: string | null;
  sucursalNombre: string | null;

  areaResponsableId: string | null;
  areaResponsableNombre: string | null;

  contacto: string | null;
  correo: string | null;
  telefono: string | null;
  observaciones: string | null;

  activo: boolean;
  totalPersonas: number;

  fechaCreacion: string;
  usuarioCreacion: string;
  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface ResponsableGuardar {
  tipo: TipoResponsable;
  nombre: string;
  codigo: string | null;

  puesto: string | null;
  departamento: string | null;

  sucursalId: string | null;
  areaResponsableId: string | null;

  contacto: string | null;
  correo: string | null;
  telefono: string | null;
  observaciones: string | null;
}

export interface ResponsableFiltro {
  buscar?: string;
  tipo?: TipoResponsable;
  activo?: boolean;
  sucursalId?: string;
  areaResponsableId?: string;

  pagina?: number;
  tamanoPagina?: number;
}

export interface ResponsablePagina {
  items: Responsable[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}