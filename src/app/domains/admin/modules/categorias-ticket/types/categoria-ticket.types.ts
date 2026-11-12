export interface CategoriaTicketList {
  id: string;
  empresaId: string;

  clave: string;
  nombre: string;
  descripcion: string | null;

  activo: boolean;
}

export interface CategoriaTicketDetalle
  extends CategoriaTicketList {

  fechaCreacion: string;
  usuarioCreacion: string;

  fechaActualizacion: string | null;
  usuarioModificacion: string | null;
}

export interface CategoriaTicketGuardar {
  clave: string;
  nombre: string;
  descripcion: string | null;
}

export interface CategoriaTicketFiltros {
  activo?: boolean;
  buscar?: string;
}