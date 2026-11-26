import {
    ESTADOS_CONTRATO,
    NOMBRES_ESTADOS_CONTRATO,
} from '../constants/estados-contrato.constants';
import {
    ContratoAccionesPermitidas,
    ContratoDetalle,
    ContratoList,
} from '../types/contrato.types';

export function obtenerEstadoEfectivoContrato(
    contrato: ContratoList
): number {

    if (
        contrato.estaVencido &&
        (
            contrato.estadoContratoId ===
                ESTADOS_CONTRATO.VIGENTE ||

            contrato.estadoContratoId ===
                ESTADOS_CONTRATO.SUSPENDIDO
        )
    ) {

        return ESTADOS_CONTRATO.VENCIDO;
    }

    return contrato.estadoContratoId;
}

export function obtenerNombreEstadoContrato(
    contrato: ContratoList
): string {

    if (!contrato.activo) {
        return 'Eliminado';
    }

    const estado =
        obtenerEstadoEfectivoContrato(contrato);

    if (estado === contrato.estadoContratoId) {

        return contrato.estadoContratoNombre ||
            NOMBRES_ESTADOS_CONTRATO[estado] ||
            'Desconocido';
    }

    return NOMBRES_ESTADOS_CONTRATO[estado] ||
        'Desconocido';
}

export function contratoTieneCoberturaVigente(
    contrato: ContratoList
): boolean {

    return contrato.activo &&

        obtenerEstadoEfectivoContrato(contrato) ===
            ESTADOS_CONTRATO.VIGENTE &&

        !contrato.estaVencido &&

        !contrato.pendienteInicio;
}

export function contratoEstaCerrado(
    contrato: ContratoList
): boolean {

    const estado =
        obtenerEstadoEfectivoContrato(contrato);

    return !contrato.activo ||

        estado ===
            ESTADOS_CONTRATO.CANCELADO ||

        estado ===
            ESTADOS_CONTRATO.FINALIZADO;
}

export function obtenerAccionesPermitidasContrato(
    contrato: ContratoList,
    puedeGestionar: boolean
): ContratoAccionesPermitidas {

    const acciones: ContratoAccionesPermitidas = {

        consultar: true,

        editar: false,

        editarVigencia: false,

        activar: false,

        suspender: false,

        reanudar: false,

        cancelar: false,

        finalizar: false,

        eliminar: false,

        renovar: false,

        asociarActivos: false,

        excluirActivos: false,
    };

    if (
        !puedeGestionar ||
        !contrato.activo
    ) {

        return acciones;
    }

    const estado =
        obtenerEstadoEfectivoContrato(contrato);

    const estadoAlmacenado =
        contrato.estadoContratoId;

    const esBorrador =
        estado === ESTADOS_CONTRATO.BORRADOR;

    const esVigente =
        estado === ESTADOS_CONTRATO.VIGENTE;

    const esSuspendido =
        estado === ESTADOS_CONTRATO.SUSPENDIDO;

    const esVencido =
        estado === ESTADOS_CONTRATO.VENCIDO;

    const esCancelado =
        estado === ESTADOS_CONTRATO.CANCELADO;

    const esFinalizado =
        estado === ESTADOS_CONTRATO.FINALIZADO;

    if (
        esCancelado ||
        esFinalizado
    ) {

        return acciones;
    }

    const tieneFechaFin =
        contrato.fechaFin !== null;

    const fechasPermitenActivacion =
        !contrato.pendienteInicio &&
        !contrato.estaVencido &&
        (
            contrato.diasRestantes === null ||
            contrato.diasRestantes >= 0
        );

    acciones.editar =
        esBorrador ||
        esVigente ||
        esSuspendido ||
        esVencido;

    acciones.editarVigencia =
        esBorrador;

    acciones.activar =
        esBorrador &&
        fechasPermitenActivacion;

    acciones.suspender =
        esVigente;

    acciones.reanudar =
        esSuspendido &&
        fechasPermitenActivacion;

    acciones.cancelar =
        esBorrador ||
        esVigente ||
        esSuspendido;

    acciones.finalizar =
        esVigente ||
        esSuspendido ||
        esVencido;

    acciones.eliminar =
        esBorrador &&
        contrato.totalActivosAsociados === 0;

    acciones.renovar =
        tieneFechaFin &&

        estadoAlmacenado !==
            ESTADOS_CONTRATO.SUSPENDIDO &&

        !contrato.pendienteInicio &&

        (
            esVigente ||
            esVencido
        );

    acciones.asociarActivos =
        esBorrador ||
        esVigente;

    acciones.excluirActivos =
        esBorrador ||
        esVigente ||
        esSuspendido;

    return acciones;
}

export function obtenerAccionesPermitidasContratoDetalle(
    contrato: ContratoDetalle,
    puedeGestionar: boolean
): ContratoAccionesPermitidas {

    const acciones =
        obtenerAccionesPermitidasContrato(
            contrato,
            puedeGestionar
        );

    if (contrato.totalRenovaciones > 0) {

        acciones.eliminar = false;
    }

    return acciones;
}

export function obtenerClaseEstadoContrato(
    contrato: ContratoList
): string {

    if (!contrato.activo) {

        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
    }

    const estado =
        obtenerEstadoEfectivoContrato(contrato);

    switch (estado) {

        case ESTADOS_CONTRATO.BORRADOR:

            return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';

        case ESTADOS_CONTRATO.VIGENTE:

            return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';

        case ESTADOS_CONTRATO.SUSPENDIDO:

            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';

        case ESTADOS_CONTRATO.CANCELADO:

            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

        case ESTADOS_CONTRATO.FINALIZADO:

            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

        case ESTADOS_CONTRATO.VENCIDO:

            return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';

        default:

            return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
    }
}

export function obtenerTextoVigenciaContrato(
    contrato: ContratoList
): string {

    if (!contrato.activo) {

        return 'Contrato eliminado';
    }

    const estado =
        obtenerEstadoEfectivoContrato(contrato);

    if (
        estado === ESTADOS_CONTRATO.CANCELADO
    ) {

        return 'Contrato cancelado';
    }

    if (
        estado === ESTADOS_CONTRATO.FINALIZADO
    ) {

        return 'Contrato finalizado';
    }

    if (
        estado === ESTADOS_CONTRATO.BORRADOR
    ) {

        return 'Pendiente de activación';
    }

    if (contrato.pendienteInicio) {

        return 'Pendiente de inicio';
    }

    const dias =
        contrato.diasRestantes;

    if (
        contrato.estaVencido ||
        estado === ESTADOS_CONTRATO.VENCIDO
    ) {

        if (
            dias !== null &&
            dias < 0
        ) {

            const diasVencido =
                Math.abs(dias);

            return diasVencido === 1
                ? 'Venció hace 1 día'
                : `Venció hace ${diasVencido} días`;
        }

        return 'Contrato vencido';
    }

    if (
        estado === ESTADOS_CONTRATO.SUSPENDIDO
    ) {

        return 'Vigencia suspendida';
    }

    if (!contrato.fechaFin) {

        return 'Vigencia indefinida';
    }

    if (dias === null) {

        return 'Sin información de vigencia';
    }

    if (dias === 0) {

        return 'Vence hoy';
    }

    if (dias === 1) {

        return 'Vence mañana';
    }

    if (dias < 0) {

        return 'Fecha de fin superada';
    }

    return `${dias} días restantes`;
}

export function obtenerClaseVigenciaContrato(
    contrato: ContratoList
): string {

    if (
        contratoEstaCerrado(contrato)
    ) {

        return 'text-on-surface-variant';
    }

    const estado =
        obtenerEstadoEfectivoContrato(contrato);

    if (
        estado === ESTADOS_CONTRATO.BORRADOR ||
        contrato.pendienteInicio
    ) {

        return 'text-on-surface-variant';
    }

    if (
        contrato.estaVencido ||
        estado === ESTADOS_CONTRATO.VENCIDO
    ) {

        return 'font-semibold text-red-700 dark:text-red-400';
    }

    if (
        estado === ESTADOS_CONTRATO.SUSPENDIDO
    ) {

        return 'font-medium text-amber-700 dark:text-amber-400';
    }

    if (contrato.diasRestantes === 0) {

        return 'font-semibold text-red-700 dark:text-red-400';
    }

    if (contrato.proximoAVencer) {

        return 'font-medium text-orange-700 dark:text-orange-400';
    }

    if (!contrato.fechaFin) {

        return 'text-on-surface-variant';
    }

    return 'text-green-700 dark:text-green-400';
}

export function obtenerFechaFormulario(
    valor: string | null | undefined
): string {

    if (!valor) {

        return '';
    }

    const fecha =
        valor.substring(0, 10);

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {

        return '';
    }

    return fecha;
}

export function formatearFechaContrato(
    valor: string | null | undefined
): string {

    const fecha =
        obtenerFechaFormulario(valor);

    if (!fecha) {

        return '—';
    }

    const [
        anio,
        mes,
        dia,
    ] = fecha.split('-');

    return `${dia}/${mes}/${anio}`;
}

export function formatearMontoContrato(
    monto: number | null | undefined,
    moneda: string | null | undefined
): string {

    if (
        monto === null ||
        monto === undefined
    ) {

        return 'Sin definir';
    }

    const codigoMoneda =
        moneda?.trim().toUpperCase() ||
        'MXN';

    try {

        return new Intl.NumberFormat(
            'es-MX',
            {
                style: 'currency',

                currency: codigoMoneda,

                currencyDisplay: 'code',

                minimumFractionDigits: 2,

                maximumFractionDigits: 2,
            }
        ).format(monto);

    } catch {

        const importe =
            new Intl.NumberFormat(
                'es-MX',
                {
                    minimumFractionDigits: 2,

                    maximumFractionDigits: 2,
                }
            ).format(monto);

        return `${codigoMoneda} ${importe}`;
    }
}

export function obtenerTextoBooleanoContrato(
    valor: boolean | null | undefined
): string {

    if (valor === true) {

        return 'Sí';
    }

    if (valor === false) {

        return 'No';
    }

    return 'No definido';
}