export interface ContratoIndicadores {
    total: number;
    vigentes: number;
    proximosAVencer: number;
    vencidos: number;
    borradores: number;
    renovacionAutomatica: number;
}

export type ContratoIndicadorFiltro =
    | 'total'
    | 'vigentes'
    | 'proximosAVencer'
    | 'vencidos'
    | 'borradores'
    | 'renovacionAutomatica';