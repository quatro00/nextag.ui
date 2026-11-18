// ==========================================
// ARCHIVO ADJUNTO
// ==========================================

export interface TicketAdjunto {
    id: string;

    empresaId: string;

    ticketId: string | null;

    ticketSeguimientoId: string | null;

    nombreOriginal: string;

    mimeType: string;

    tamanoBytes: number;

    estadoAlmacenamiento: string;

    visibleSolicitante: boolean;

    fechaCreacion: string;

    usuarioCreacion: string | null;
}