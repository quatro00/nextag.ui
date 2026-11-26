export interface ContratoList {

    id: string;

    empresaId: string;

    numeroContrato: string;

    nombre: string;

    tipoContratoId: string;

    tipoContratoNombre: string;

    estadoContratoId: number;

    estadoContratoClave: string;

    estadoContratoNombre: string;

    clienteId: string | null;

    clienteNombre: string | null;

    proveedorId: string | null;

    proveedorNombre: string | null;

    fechaInicio: string;

    fechaFin: string | null;

    renovacionAutomatica: boolean;

    monto: number | null;

    moneda: string;

    periodicidadPago: string | null;

    activo: boolean;

    totalActivosAsociados: number;

    diasRestantes: number | null;

    estaVencido: boolean;

    proximoAVencer: boolean;

    pendienteInicio: boolean;
}

export interface ContratoDetalle extends ContratoList {

    descripcion: string | null;

    fechaFirma: string | null;

    diasAvisoNoRenovacion: number | null;

    diaPago: number | null;

    incluyeImpuestos: boolean;

    incluyePreventivo: boolean | null;

    incluyeCorrectivo: boolean | null;

    incluyeRefacciones: boolean | null;

    incluyeManoObra: boolean | null;

    tiempoRespuestaHoras: number | null;

    horarioAtencion: string | null;

    serviciosIncluidos: number | null;

    condicionesServicio: string | null;

    fechaCancelacion: string | null;

    motivoCancelacion: string | null;

    usuarioCancelacion: string | null;

    fechaFinalizacion: string | null;

    observaciones: string | null;

    totalRenovaciones: number;

    fechaCreacion: string;

    usuarioCreacion: string;

    fechaActualizacion: string | null;

    usuarioModificacion: string | null;
}

export interface ContratoGuardar {

    numeroContrato: string;

    nombre: string;

    descripcion: string | null;

    tipoContratoId: string;

    clienteId: string | null;

    proveedorId: string | null;

    fechaInicio: string;

    fechaFin: string | null;

    fechaFirma: string | null;

    renovacionAutomatica: boolean;

    diasAvisoNoRenovacion: number | null;

    monto: number | null;

    moneda: string;

    periodicidadPago: string | null;

    diaPago: number | null;

    incluyeImpuestos: boolean;

    incluyePreventivo: boolean | null;

    incluyeCorrectivo: boolean | null;

    incluyeRefacciones: boolean | null;

    incluyeManoObra: boolean | null;

    tiempoRespuestaHoras: number | null;

    horarioAtencion: string | null;

    serviciosIncluidos: number | null;

    condicionesServicio: string | null;

    observaciones: string | null;
}

export interface ContratoFiltros {

    buscar?: string | null;

    tipoContratoId?: string | null;

    estadoContratoId?: number | null;

    clienteId?: string | null;

    proveedorId?: string | null;

    activo?: boolean;

    renovacionAutomatica?: boolean | null;

    moneda?: string | null;

    fechaInicioDesde?: string | null;

    fechaInicioHasta?: string | null;

    fechaFinDesde?: string | null;

    fechaFinHasta?: string | null;

    vencidos?: boolean | null;

    proximosAVencer?: boolean | null;

    sinFechaFin?: boolean | null;

    diasProximosAVencer?: number;

    pagina?: number;

    registrosPorPagina?: number;
}

export interface ContratoListado {

    items: ContratoList[];

    totalRegistros: number;

    pagina: number;

    registrosPorPagina: number;

    totalPaginas: number;
}

export interface ContratoCancelar {

    motivo: string;
}

export type ContratoAccionEstado =
    | 'activar'
    | 'suspender'
    | 'reanudar'
    | 'cancelar'
    | 'finalizar';

export interface ContratoAccionesPermitidas {

    consultar: boolean;

    editar: boolean;

    editarVigencia: boolean;

    activar: boolean;

    suspender: boolean;

    reanudar: boolean;

    cancelar: boolean;

    finalizar: boolean;

    eliminar: boolean;

    renovar: boolean;

    asociarActivos: boolean;

    excluirActivos: boolean;
}