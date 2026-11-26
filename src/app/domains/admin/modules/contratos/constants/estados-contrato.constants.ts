export const ESTADOS_CONTRATO = {
    BORRADOR: 1,
    VIGENTE: 2,
    SUSPENDIDO: 3,
    CANCELADO: 4,
    FINALIZADO: 5,
    VENCIDO: 6,
} as const;

export type EstadoContratoId =
    typeof ESTADOS_CONTRATO[keyof typeof ESTADOS_CONTRATO];

export const CLAVES_ESTADOS_CONTRATO = {
    BORRADOR: 'BORRADOR',
    VIGENTE: 'VIGENTE',
    SUSPENDIDO: 'SUSPENDIDO',
    CANCELADO: 'CANCELADO',
    FINALIZADO: 'FINALIZADO',
    VENCIDO: 'VENCIDO',
} as const;

export const NOMBRES_ESTADOS_CONTRATO: Record<number, string> = {
    [ESTADOS_CONTRATO.BORRADOR]: 'Borrador',
    [ESTADOS_CONTRATO.VIGENTE]: 'Vigente',
    [ESTADOS_CONTRATO.SUSPENDIDO]: 'Suspendido',
    [ESTADOS_CONTRATO.CANCELADO]: 'Cancelado',
    [ESTADOS_CONTRATO.FINALIZADO]: 'Finalizado',
    [ESTADOS_CONTRATO.VENCIDO]: 'Vencido',
};