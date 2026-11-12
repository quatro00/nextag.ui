export interface TicketAsignacion {
  id: string;
  empresaId: string;

  ticketId: string;
  ticketFolio: string;
  ticketTitulo: string;

  equipoSoporteId: string;
  equipoSoporteNombre: string;
  equipoSoporteTipo: string;

  usuarioTecnicoId: string | null;
  usuarioTecnicoNombre: string | null;
  usuarioTecnicoCorreo: string | null;

  fechaAsignacion: string;
  fechaFin: string | null;

  motivo: string | null;
  usuarioCreacion: string;

  vigente: boolean;
}

export interface TicketAsignar {
  equipoSoporteId: string;
  usuarioTecnicoId: string | null;
  motivo: string | null;
}

export interface TicketReasignar {
  equipoSoporteId: string;
  usuarioTecnicoId: string | null;
  motivo: string;
}

export interface TicketEstadoHistorial {
  id: string;
  ticketId: string;

  estadoAnteriorId: number | null;
  estadoAnteriorNombre: string | null;

  estadoNuevoId: number;
  estadoNuevoNombre: string;

  motivo: string | null;

  fechaCambio: string;
  usuarioId: string | null;
}

export type TipoSeguimiento =
  | 'COMENTARIO'
  | 'NOTA_INTERNA'
  | 'SOLUCION';

export interface TicketSeguimiento {
  id: string;
  empresaId: string;
  ticketId: string;

  tipo: TipoSeguimiento;
  comentario: string;

  visibleSolicitante: boolean;

  autorUsuarioId: string | null;
  autorNombre: string | null;

  fechaCreacion: string;
}