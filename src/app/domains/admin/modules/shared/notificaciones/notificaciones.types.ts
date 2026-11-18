// ==========================================
// NOTIFICACION
// ==========================================

export interface Notificacion {
    id: string;

    empresaId: string;

    ticketId: string | null;

    eventoClave: string;

    titulo: string;

    mensaje: string;

    rutaNavegacion: string | null;

    fechaCreacion: string;

    fechaLectura: string | null;

    leida: boolean;
}

// ==========================================
// RESULTADO PAGINADO
// ==========================================

export interface NotificacionPaginado {
    items: Notificacion[];

    totalRegistros: number;

    pagina: number;

    tamanoPagina: number;

    totalPaginas: number;
}

// ==========================================
// CONTADOR
// ==========================================

export interface NotificacionContador {
    noLeidas: number;
}

// ==========================================
// PARAMETROS DE CONSULTA
// ==========================================

export interface NotificacionConsulta {
    pagina?: number;

    tamanoPagina?: number;

    soloNoLeidas?: boolean;
}