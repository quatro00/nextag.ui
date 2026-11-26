import { HttpErrorResponse } from '@angular/common/http';

import {
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    signal,
    untracked,
} from '@angular/core';

import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import {
    takeUntilDestroyed,
    toSignal,
} from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';

import {
    firstValueFrom,
    map,
    Observable,
    Subscription,
} from 'rxjs';

import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';

import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';

import { ContratosService } from '../../services/contratos.service';

import {
    ContratoDetalle,
} from '../../types/contrato.types';

import {
    ContratoOperacion,
    ContratoOperacionDialogData,
    ContratoOperacionDialogResult,
} from '../../types/contrato-operacion.types';

import {
    ESTADOS_CONTRATO,
} from '../../constants/estados-contrato.constants';

import {
    obtenerNombrePeriodicidad,
} from '../../constants/periodicidades-pago.constants';

import {
    obtenerAccionesPermitidasContratoDetalle,
    obtenerEstadoEfectivoContrato,
    obtenerNombreEstadoContrato,
    obtenerClaseEstadoContrato,
    obtenerTextoVigenciaContrato,
    obtenerClaseVigenciaContrato,
    contratoTieneCoberturaVigente,
    formatearFechaContrato,
    formatearMontoContrato,
    obtenerTextoBooleanoContrato,
} from '../../utils/contrato.utils';

import ContratoOperacionDialog
    from '../contrato-operacion-dialog/contrato-operacion-dialog';

@Component({
    selector: 'app-contrato-detalle',

    templateUrl: './contrato-detalle.html',

    imports: [
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatTabsModule,
    ],
})
export default class ContratoDetalleComponent {

    // Agregar aquí las siguientes secciones.
    private readonly route =
    inject(ActivatedRoute);

private readonly router =
    inject(Router);

private readonly auth =
    inject(AuthService);

private readonly dialog =
    inject(MatDialog);

private readonly destroyRef =
    inject(DestroyRef);

private readonly contratosService =
    inject(ContratosService);

protected readonly empresaContexto =
    inject(EmpresaContextoService);

    protected readonly id = toSignal(

    this.route.paramMap.pipe(
        map(params => params.get('id'))
    ),

    {
        initialValue:
            this.route.snapshot.paramMap.get('id'),
    }
);

protected readonly contrato =
    signal<ContratoDetalle | null>(null);

protected readonly loading =
    signal(false);

protected readonly confirmando =
    signal(false);

protected readonly operacionActual =
    signal<ContratoOperacion | null>(null);

protected readonly errorMessage =
    signal<string | null>(null);

protected readonly successMessage =
    signal<string | null>(null);

protected readonly pestanaSeleccionada =
    signal(0);

private readonly empresaDetalle =
    signal<string | null>(null);

private cargaSub?: Subscription;

private secuenciaCarga = 0;

private destruido = false;

protected readonly estados =
    ESTADOS_CONTRATO;

protected readonly nombreEstado =
    obtenerNombreEstadoContrato;

protected readonly claseEstado =
    obtenerClaseEstadoContrato;

protected readonly textoVigencia =
    obtenerTextoVigenciaContrato;

protected readonly claseVigencia =
    obtenerClaseVigenciaContrato;

protected readonly formatoFecha =
    formatearFechaContrato;

protected readonly formatoMonto =
    formatearMontoContrato;

protected readonly textoBooleano =
    obtenerTextoBooleanoContrato;

protected readonly nombrePeriodicidad =
    obtenerNombrePeriodicidad;

protected readonly coberturaVigente =
    contratoTieneCoberturaVigente;

    protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([
        AUTH_ROLES.ADMINISTRADOR,
        AUTH_ROLES.ADMIN_EMPRESA,
    ])
);

protected readonly acciones = computed(() => {

    const contrato =
        this.contrato();

    if (!contrato) {
        return null;
    }

    return obtenerAccionesPermitidasContratoDetalle(

        contrato,

        this.puedeGestionar()

    );
});

protected readonly ocupado = computed(() =>

    this.loading() ||

    this.confirmando() ||

    this.operacionActual() !== null

);

protected readonly estadoCalculado = computed(() => {

    const contrato =
        this.contrato();

    if (
        !contrato ||
        !contrato.activo
    ) {
        return false;
    }

    return obtenerEstadoEfectivoContrato(contrato) !==
        contrato.estadoContratoId;
});

protected readonly motivoNoActivacion = computed(() => {

    const contrato =
        this.contrato();

    if (
        !contrato ||
        !contrato.activo ||
        !this.puedeGestionar() ||
        contrato.estadoContratoId !==
            ESTADOS_CONTRATO.BORRADOR
    ) {
        return null;
    }

    if (contrato.pendienteInicio) {

        return 'El contrato todavía no ha iniciado su vigencia.';
    }

    if (
        contrato.diasRestantes !== null &&
        contrato.diasRestantes < 0
    ) {

        return 'La fecha de fin del contrato ya transcurrió.';
    }

    return null;
});

protected readonly motivoNoEliminacion = computed(() => {

    const contrato =
        this.contrato();

    if (
        !contrato ||
        !contrato.activo ||
        !this.puedeGestionar() ||
        contrato.estadoContratoId !==
            ESTADOS_CONTRATO.BORRADOR
    ) {
        return null;
    }

    if (contrato.totalActivosAsociados > 0) {

        return 'No se puede eliminar mientras tenga activos asociados.';
    }

    if (contrato.totalRenovaciones > 0) {

        return 'No se puede eliminar porque tiene historial de renovaciones.';
    }

    return null;
});

private cargarContrato(
    empresaId: string | null,
    contratoId: string | null,
    conservarMensaje: boolean
): void {

    this.cargaSub?.unsubscribe();

    const secuencia =
        ++this.secuenciaCarga;

    this.contrato.set(null);

    this.empresaDetalle.set(null);

    this.errorMessage.set(null);

    if (!conservarMensaje) {

        this.successMessage.set(null);
    }

    this.loading.set(
        !!empresaId && !!contratoId
    );

    if (
        !empresaId ||
        !contratoId
    ) {
        return;
    }

    this.cargaSub = this.contratosService

        .getById(contratoId)

        .subscribe({

            next: contrato => {

                if (!this.contextoVigente(

                    empresaId,

                    contratoId,

                    secuencia

                )) {
                    return;
                }

                if (

                    contrato.empresaId !== empresaId ||

                    contrato.id !== contratoId

                ) {

                    this.errorMessage.set(

                        'La información recibida no corresponde al contrato o empresa seleccionados.'

                    );

                    this.loading.set(false);

                    return;
                }

                this.contrato.set(contrato);

                this.empresaDetalle.set(empresaId);

                this.loading.set(false);

                if (

                    !conservarMensaje &&

                    this.consumirMensajeCreacion(
                        empresaId,
                        contratoId
                    )

                ) {

                    this.successMessage.set(

                        'Contrato registrado correctamente.'

                    );
                }
            },

            error: (error: unknown) => {

                if (!this.contextoVigente(

                    empresaId,

                    contratoId,

                    secuencia

                )) {
                    return;
                }

                this.errorMessage.set(

                    this.mensajeError(

                        error,

                        'No fue posible cargar la información del contrato.'

                    )

                );

                this.loading.set(false);
            },

        });
}

private contextoVigente(
    empresaId: string,
    contratoId: string,
    secuencia: number
): boolean {

    return !this.destruido &&

        this.empresaContexto.empresaId === empresaId &&

        this.id() === contratoId &&

        this.secuenciaCarga === secuencia;
}

private consumirMensajeCreacion(
    empresaId: string,
    contratoId: string
): boolean {

    const state =
        window.history.state;

    if (

        !state?.contratoCreado ||

        state.empresaId !== empresaId ||

        state.contratoId !== contratoId

    ) {
        return false;
    }

    const nuevoState = {
        ...state,
    };

    delete nuevoState.contratoCreado;

    delete nuevoState.empresaId;

    delete nuevoState.contratoId;

    window.history.replaceState(

        nuevoState,

        ''

    );

    return true;
}

protected actualizar(): void {

    if (this.ocupado()) {
        return;
    }

    this.cargarContrato(

        this.empresaContexto.empresaId,

        this.id(),

        false

    );
}

protected volver(): void {

    if (

        this.confirmando() ||

        this.operacionActual() !== null

    ) {
        return;
    }

    void this.router.navigate([
        '/admin/contratos',
    ]);
}

protected editar(): void {

    const contrato =
        this.contrato();

    if (

        !contrato ||

        this.ocupado() ||

        !this.acciones()?.editar ||

        contrato.empresaId !==
            this.empresaContexto.empresaId

    ) {
        return;
    }

    void this.router.navigate([

        '/admin/contratos',

        contrato.id,

        'editar',

    ]);
}

protected cambiarPestana(
    indice: number
): void {

    this.pestanaSeleccionada.set(
        indice
    );
}

private obtenerConfiguracionOperacion(
    operacion: ContratoOperacion,
    contrato: ContratoDetalle
): ContratoOperacionDialogData {

    const base = {

        operacion,

        numeroContrato:
            contrato.numeroContrato,

        nombreContrato:
            contrato.nombre,

        requiereMotivo: false,

        destructiva: false,

    };

    switch (operacion) {

        case 'activar':

            return {

                ...base,

                titulo: 'Activar contrato',

                mensaje:
                    'El contrato cambiará a estado Vigente. A partir de este momento su vigencia y cobertura podrán considerarse operativas. ¿Deseas continuar?',

                textoConfirmar: 'Activar contrato',

            };

        case 'suspender':

            return {

                ...base,

                titulo: 'Suspender contrato',

                mensaje:
                    'El contrato cambiará a estado Suspendido. Se conservarán sus activos asociados y su información, pero dejará de considerarse una cobertura vigente mientras permanezca suspendido.',

                textoConfirmar: 'Suspender contrato',

            };

        case 'reanudar':

            return {

                ...base,

                titulo: 'Reanudar contrato',

                mensaje:
                    'El contrato regresará al estado Vigente, siempre que sus fechas permitan la reanudación.',

                textoConfirmar: 'Reanudar contrato',

            };

        case 'cancelar':

            return {

                ...base,

                titulo: 'Cancelar contrato',

                mensaje:
                    'El contrato será cancelado definitivamente. Se conservará su información histórica, pero ya no podrá editarse ni renovarse. Esta operación requiere un motivo.',

                textoConfirmar: 'Cancelar contrato',

                requiereMotivo: true,

                destructiva: true,

            };

        case 'finalizar':

            return {

                ...base,

                titulo: 'Finalizar contrato',

                mensaje:
                    'El contrato cambiará a estado Finalizado. Se conservará su historial, pero ya no podrá editarse ni renovarse.',

                textoConfirmar: 'Finalizar contrato',

                destructiva: true,

            };

        case 'eliminar':

            return {

                ...base,

                titulo: 'Eliminar contrato',

                mensaje:
                    'El contrato será dado de baja y dejará de aparecer en el listado principal. Su registro se conservará en la base de datos. Esta operación únicamente está permitida para contratos en borrador sin activos asociados ni renovaciones.',

                textoConfirmar: 'Eliminar contrato',

                destructiva: true,

            };
    }
}

private operacionPermitida(
    operacion: ContratoOperacion,
    contrato: ContratoDetalle
): boolean {

    const acciones =
        obtenerAccionesPermitidasContratoDetalle(

            contrato,

            this.puedeGestionar()

        );

    return acciones[operacion] === true;
}

protected async solicitarOperacion(
    operacion: ContratoOperacion
): Promise<void> {

    const contrato =
        this.contrato();

    const empresaId =
        this.empresaContexto.empresaId;

    if (

        this.ocupado() ||

        !contrato ||

        !empresaId ||

        this.empresaDetalle() !== empresaId ||

        contrato.empresaId !== empresaId ||

        !this.operacionPermitida(
            operacion,
            contrato
        )

    ) {
        return;
    }

    const contratoId =
        contrato.id;

    const secuencia =
        this.secuenciaCarga;

    const configuracion =
        this.obtenerConfiguracionOperacion(

            operacion,

            contrato

        );

    this.confirmando.set(true);

    this.errorMessage.set(null);

    this.successMessage.set(null);

    const dialogRef = this.dialog.open<

        ContratoOperacionDialog,

        ContratoOperacionDialogData,

        ContratoOperacionDialogResult

    >(

        ContratoOperacionDialog,

        {

            width: '520px',

            maxWidth: '95vw',

            autoFocus: false,

            disableClose: true,

            data: configuracion,

        }

    );

    let resultado:
        ContratoOperacionDialogResult | undefined;

    try {

        resultado = await firstValueFrom(

            dialogRef.afterClosed().pipe(

                takeUntilDestroyed(
                    this.destroyRef
                )

            ),

            {
                defaultValue: undefined,
            }

        );

    } finally {

        if (!this.destruido) {

            this.confirmando.set(false);
        }
    }

    if (

        !resultado?.confirmado ||

        !this.contextoVigente(

            empresaId,

            contratoId,

            secuencia

        )

    ) {
        return;
    }

    const actual =
        this.contrato();

    if (

        !actual ||

        actual.id !== contratoId ||

        actual.empresaId !== empresaId ||

        this.empresaDetalle() !== empresaId ||

        !this.operacionPermitida(
            operacion,
            actual
        )

    ) {

        this.errorMessage.set(

            'La operación ya no está disponible para el contrato seleccionado.'

        );

        return;
    }

    await this.ejecutarOperacion(

        operacion,

        actual,

        resultado.motivo,

        empresaId,

        secuencia

    );
}

private obtenerPeticionOperacion(
    operacion: Exclude<ContratoOperacion, 'eliminar'>,
    id: string,
    motivo: string | null
): Observable<ContratoDetalle> {

    switch (operacion) {

        case 'activar':

            return this.contratosService.activar(id);

        case 'suspender':

            return this.contratosService.suspender(id);

        case 'reanudar':

            return this.contratosService.reanudar(id);

        case 'cancelar':

            return this.contratosService.cancelar(

                id,

                {
                    motivo: motivo ?? '',
                }

            );

        case 'finalizar':

            return this.contratosService.finalizar(id);
    }
}

private obtenerMensajeOperacion(
    operacion: ContratoOperacion
): string {

    switch (operacion) {

        case 'activar':

            return 'Contrato activado correctamente.';

        case 'suspender':

            return 'Contrato suspendido correctamente.';

        case 'reanudar':

            return 'Contrato reanudado correctamente.';

        case 'cancelar':

            return 'Contrato cancelado correctamente.';

        case 'finalizar':

            return 'Contrato finalizado correctamente.';

        case 'eliminar':

            return 'Contrato eliminado correctamente.';
    }
}

private async ejecutarOperacion(
    operacion: ContratoOperacion,
    contrato: ContratoDetalle,
    motivo: string | null,
    empresaId: string,
    secuencia: number
): Promise<void> {

    if (

        this.ocupado() ||

        !this.contextoVigente(

            empresaId,

            contrato.id,

            secuencia

        ) ||

        !this.operacionPermitida(
            operacion,
            contrato
        )

    ) {
        return;
    }

    if (

        operacion === 'cancelar' &&

        !motivo?.trim()

    ) {

        this.errorMessage.set(

            'El motivo de cancelación es obligatorio.'

        );

        return;
    }

    this.operacionActual.set(
        operacion
    );

    this.errorMessage.set(null);

    this.successMessage.set(null);

    try {

        if (operacion === 'eliminar') {

            await firstValueFrom(

                this.contratosService.delete(
                    contrato.id
                )

            );

            if (!this.contextoVigente(

                empresaId,

                contrato.id,

                secuencia

            )) {
                return;
            }

            this.successMessage.set(

                this.obtenerMensajeOperacion(
                    operacion
                )

            );

            // Recargar el contrato después de
            // la baja lógica. El detalle seguirá
            // disponible en modo de solo lectura.

            this.cargarContrato(

                empresaId,

                contrato.id,

                true

            );

            return;
        }

        const actualizado =
            await firstValueFrom(

                this.obtenerPeticionOperacion(

                    operacion,

                    contrato.id,

                    motivo

                )

            );

        if (!this.contextoVigente(

            empresaId,

            contrato.id,

            secuencia

        )) {
            return;
        }

        if (

            actualizado.empresaId !== empresaId ||

            actualizado.id !== contrato.id

        ) {

            this.errorMessage.set(

                'La respuesta recibida no corresponde al contrato seleccionado.'

            );

            return;
        }

        this.contrato.set(
            actualizado
        );

        this.successMessage.set(

            this.obtenerMensajeOperacion(
                operacion
            )

        );

    } catch (error) {

        if (this.contextoVigente(

            empresaId,

            contrato.id,

            secuencia

        )) {

            this.errorMessage.set(

                this.mensajeError(

                    error,

                    'No fue posible realizar la operación solicitada.'

                )

            );
        }

    } finally {

        if (!this.destruido) {

            this.operacionActual.set(null);
        }
    }
}

protected formatoFechaHora(
    valor: string | null | undefined
): string {

    if (!valor) {

        return '—';
    }

    // Los campos de auditoría se almacenan en UTC.
    // SQL Server puede devolverlos sin información
    // explícita de zona horaria.

    const tieneZonaHoraria =
        /(?:Z|[+-]\d{2}:\d{2})$/i.test(
            valor
        );

    const valorUtc =
        tieneZonaHoraria
            ? valor
            : `${valor}Z`;

    const fecha =
        new Date(valorUtc);

    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {
        return '—';
    }

    return new Intl.DateTimeFormat(

        'es-MX',

        {

            dateStyle: 'medium',

            timeStyle: 'short',

            timeZone:
                'America/Monterrey',

        }

    ).format(fecha);
}

private mensajeError(
    error: unknown,
    fallback: string
): string {

    if (error instanceof HttpErrorResponse) {

        if (
            typeof error.error?.message === 'string'
        ) {

            return error.error.message;
        }

        const errores =
            error.error?.errors;

        if (

            errores &&

            typeof errores === 'object'

        ) {

            const mensajes = Object

                .values(errores)

                .flat()

                .filter(

                    (x): x is string =>
                        typeof x === 'string'

                );

            if (mensajes.length > 0) {

                return mensajes.join(' ');
            }
        }
    }

    return fallback;
}


}