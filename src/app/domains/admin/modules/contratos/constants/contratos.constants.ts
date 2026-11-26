export const CONTRATOS_CONFIG = {
    PAGINA_INICIAL: 1,

    REGISTROS_POR_PAGINA: 25,

    MAX_REGISTROS_POR_PAGINA: 200,

    DIAS_PROXIMOS_A_VENCER: 30,

    MIN_DIAS_PROXIMOS_A_VENCER: 1,

    MAX_DIAS_PROXIMOS_A_VENCER: 365,

    MONEDA_PREDETERMINADA: 'MXN',

    MAX_NUMERO_CONTRATO: 50,

    MAX_NOMBRE: 200,

    MAX_HORARIO_ATENCION: 200,

    MAX_MOTIVO_CANCELACION: 500,

    MAX_PERIODICIDAD_PAGO: 20,

    MAX_ENTERO: 2147483647,

    MAX_TIEMPO_RESPUESTA_HORAS: 99999999.99,

    MIN_DIA_PAGO: 1,

    MAX_DIA_PAGO: 31,
} as const;

export const CONTRATOS_OPCIONES_PAGINACION = [
    10,
    25,
    50,
    100,
    200,
];

export const CONTRATOS_OPCIONES_VENCIMIENTO = [
    {
        value: 7,
        label: 'Próximos 7 días',
    },
    {
        value: 15,
        label: 'Próximos 15 días',
    },
    {
        value: 30,
        label: 'Próximos 30 días',
    },
    {
        value: 60,
        label: 'Próximos 60 días',
    },
    {
        value: 90,
        label: 'Próximos 90 días',
    },
    {
        value: 180,
        label: 'Próximos 180 días',
    },
] as const;

export const CONTRATOS_MONEDAS_SUGERIDAS = [
    {
        value: 'MXN',
        label: 'MXN - Peso mexicano',
    },
    {
        value: 'USD',
        label: 'USD - Dólar estadounidense',
    },
    {
        value: 'EUR',
        label: 'EUR - Euro',
    },
    {
        value: 'CAD',
        label: 'CAD - Dólar canadiense',
    },
] as const;