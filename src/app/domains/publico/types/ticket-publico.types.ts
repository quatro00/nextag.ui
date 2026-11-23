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
    // ======================================
    // NOTIFICACIONES
    // ======================================
    recibirCorreo: boolean;
    recibirWhatsapp: boolean;
    consentimientoWhatsapp: boolean;
    versionAvisoWhatsapp: string | null;
}

export interface TicketPublicoResultado {
  id: string;
  folio: string;
  mensaje: string;
  fechaApertura: string;

  // ======================================
  // AUTORIZACION DE ADJUNTOS
  // ======================================

  tokenCargaAdjuntos: string | null;
  fechaExpiracionAdjuntos: string | null;
  maximoAdjuntos: number;
}