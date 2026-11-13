export interface CategoriaTicketPublica {
  id: string;
  nombre: string;
}

export interface TicketPublicoCrear {
  nombre: string;
  correo: string | null;
  telefono: string | null;
  categoriaTicketId: string | null;
  titulo: string;
  descripcion: string;
}

export interface TicketPublicoResultado {
  id: string;
  folio: string;
  mensaje: string;
  fechaApertura: string;
}