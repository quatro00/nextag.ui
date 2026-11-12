export interface TicketList {
  id: string;
  empresaId: string;

  numero: number;
  folio: string;

  activoId: string | null;
  activoCodigo: string | null;
  activoNombre: string | null;

  categoriaTicketId: string | null;
  categoriaNombre: string | null;

  prioridadTicketId: number;
  prioridadNombre: string;

  estadoTicketId: number;
  estadoNombre: string;

  origen: string;

  titulo: string;

  solicitanteUsuarioId: string | null;
  solicitanteNombre: string | null;

  fechaApertura: string;
}

export interface TicketDetalle extends TicketList {
  descripcion: string;

  solicitanteCorreo: string | null;
  solicitanteTelefono: string | null;

  fechaPrimeraAtencion: string | null;
  fechaResolucion: string | null;
  fechaCierre: string | null;
  fechaCancelacion: string | null;

  motivoCancelacion: string | null;

  fechaCreacion: string;
  usuarioCreacion: string | null;

  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface TicketGuardar {
  activoId: string | null;
  categoriaTicketId: string | null;

  prioridadTicketId: number;

  titulo: string;
  descripcion: string;
}

export interface TicketFiltro {
  buscar?: string;

  estadoTicketId?: number;
  prioridadTicketId?: number;

  categoriaTicketId?: string;
  activoId?: string;

  fechaInicio?: string;
  fechaFin?: string;

  pagina?: number;
  tamanoPagina?: number;
}

export interface TicketPaginado {
  items: TicketList[];

  totalRegistros: number;

  pagina: number;
  tamanoPagina: number;

  totalPaginas: number;
}

export interface TicketCatalogo {
  id: number;
  clave: string;
  nombre: string;
  orden: number;
}