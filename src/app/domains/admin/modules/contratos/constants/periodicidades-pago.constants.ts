export const PERIODICIDADES_PAGO = [
    {
        value: 'UNICO',
        label: 'Pago único',
    },
    {
        value: 'SEMANAL',
        label: 'Semanal',
    },
    {
        value: 'QUINCENAL',
        label: 'Quincenal',
    },
    {
        value: 'MENSUAL',
        label: 'Mensual',
    },
    {
        value: 'BIMESTRAL',
        label: 'Bimestral',
    },
    {
        value: 'TRIMESTRAL',
        label: 'Trimestral',
    },
    {
        value: 'SEMESTRAL',
        label: 'Semestral',
    },
    {
        value: 'ANUAL',
        label: 'Anual',
    },
    {
        value: 'OTRO',
        label: 'Otro',
    },
] as const;

export type PeriodicidadPago =
    typeof PERIODICIDADES_PAGO[number]['value'];

export function obtenerNombrePeriodicidad(
    periodicidad: string | null | undefined
): string {

    if (!periodicidad) {
        return 'Sin definir';
    }

    return PERIODICIDADES_PAGO.find(
        x => x.value === periodicidad
    )?.label ?? periodicidad;
}