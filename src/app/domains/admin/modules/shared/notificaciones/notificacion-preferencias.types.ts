// ==========================================
// PREFERENCIAS DE NOTIFICACION
// ==========================================

export interface NotificacionPreferencia {

    eventoId: number;

    eventoClave: string;

    eventoNombre: string;

    eventoDescripcion: string | null;

    // ======================================
    // CANALES
    // ======================================

    interna: boolean;

    correo: boolean;

    whatsapp: boolean;

    // ======================================
    // CONSENTIMIENTO
    // ======================================

    consentimientoWhatsapp: boolean;

    fechaConsentimientoWhatsapp: string | null;

    versionAviso: string | null;

    // ======================================
    // DISPONIBILIDAD
    // ======================================

    correoDisponible: boolean;

    whatsappDisponible: boolean;
}


// ==========================================
// GUARDAR PREFERENCIAS
// ==========================================

export interface NotificacionPreferenciaGuardar {

    interna: boolean;

    correo: boolean;

    whatsapp: boolean;

    consentimientoWhatsapp: boolean;

    versionAviso: string | null;
}


// ==========================================
// ESTADO LOCAL DE EDICION
// ==========================================

export interface NotificacionPreferenciaEdicion
    extends NotificacionPreferencia {

    modificada: boolean;

    guardando: boolean;
}