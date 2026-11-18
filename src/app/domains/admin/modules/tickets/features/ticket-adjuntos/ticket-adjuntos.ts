import {
    Component,
    computed,
    effect,
    inject,
    input,
    signal,
} from '@angular/core';

import { DatePipe, DecimalPipe } from '@angular/common';

import {
    Observable,
    Subscription,
    switchMap,
} from 'rxjs';

import { MatButtonModule } from
    '@angular/material/button';

import { MatIconModule } from
    '@angular/material/icon';

import { MatProgressSpinnerModule } from
    '@angular/material/progress-spinner';

import { EmpresaContextoService } from
    '@/app/core/empresa-contexto.service';

import { AuthService } from
    '@/app/domains/auth/services/auth.services';

import { AUTH_ROLES } from
    '@/app/domains/auth/constants/auth.roles';

import { TicketAdjuntosService } from
    '../../services/ticket-adjuntos.service';

import { TicketAdjunto } from
    '../../types/ticket-adjunto.types';

import { mensajeApi } from
    '../../../shared/api-error';

type OperacionArchivo =
    | 'SUBIENDO'
    | 'DESCARGANDO'
    | 'ELIMINANDO';

@Component({
    selector: 'app-ticket-adjuntos',

    templateUrl: './ticket-adjuntos.html',

    imports: [
        DatePipe,
        DecimalPipe,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
})
export class TicketAdjuntosComponent {

    private readonly service =
        inject(TicketAdjuntosService);

    private readonly auth =
        inject(AuthService);

    private readonly empresa =
        inject(EmpresaContextoService);

    // ==========================================
    // PARAMETROS
    // ==========================================

    readonly ticketId = input.required<string>();

    readonly estadoClave = input<string>('');

    // ==========================================
    // DATOS
    // ==========================================

    protected readonly archivos =
        signal<TicketAdjunto[]>([]);

    protected readonly loading = signal(false);

    protected readonly operacion =
        signal<OperacionArchivo | null>(null);

    protected readonly archivoProcesandoId =
        signal<string | null>(null);

    protected readonly error =
        signal<string | null>(null);

    protected readonly mensaje =
        signal<string | null>(null);

    // ==========================================
    // CONTROL DE SOLICITUDES
    // ==========================================

    private solicitud = 0;

    private operacionSub: Subscription | null = null;

    // ==========================================
    // CONFIGURACION
    // ==========================================

    private readonly maximoBytes =
        10 * 1024 * 1024;

    private readonly extensionesPermitidas = [
        '.jpg',
        '.png',
        '.webp',
        '.pdf',
    ];

    // ==========================================
    // PERMISOS
    // ==========================================

    protected readonly esAdministrador = computed(() =>
        this.auth.hasAnyRole([
            AUTH_ROLES.ADMINISTRADOR,
            AUTH_ROLES.ADMIN_EMPRESA,
        ])
    );

    protected readonly puedeOperar = computed(() =>
        this.auth.hasAnyRole([
            AUTH_ROLES.ADMINISTRADOR,
            AUTH_ROLES.ADMIN_EMPRESA,
            AUTH_ROLES.OPERADOR,
        ])
    );

    protected readonly ticketCerrado = computed(() =>
        ['CERRADO', 'CANCELADO']
            .includes(this.estadoClave())
    );

    // ==========================================
    // PROCESAMIENTO
    // ==========================================

    protected readonly procesando = computed(() =>
        this.operacion() !== null
    );

    protected readonly puedeSubir = computed(() =>
        this.puedeOperar() &&
        !this.ticketCerrado()
    );

    protected readonly totalArchivos = computed(() =>
        this.archivos().length
    );

    // ==========================================
    // INICIALIZACION
    // ==========================================

    constructor() {

        effect((onCleanup) => {

            const empresaId =
                this.empresa.seleccionada()?.id ?? null;

            const ticketId = this.ticketId();

            const req = ++this.solicitud;

            // ======================================
            // CANCELAR OPERACION ANTERIOR
            // ======================================

            this.operacionSub?.unsubscribe();

            this.operacionSub = null;

            this.operacion.set(null);

            this.archivoProcesandoId.set(null);

            // ======================================
            // LIMPIAR INFORMACION
            // ======================================

            this.archivos.set([]);

            this.error.set(null);
            this.mensaje.set(null);

            this.loading.set(
                !!empresaId && !!ticketId
            );

            if (!empresaId || !ticketId) {
                return;
            }

            // ======================================
            // CONSULTAR ARCHIVOS
            // ======================================

            const sub = this.service
                .getAll(ticketId)
                .subscribe({

                    next: archivos => {

                        if (
                            req !== this.solicitud ||
                            !this.contextoValido(
                                empresaId,
                                ticketId
                            )
                        ) {
                            return;
                        }

                        this.archivos.set(archivos);

                        this.loading.set(false);
                    },

                    error: err => {

                        if (
                            req !== this.solicitud ||
                            !this.contextoValido(
                                empresaId,
                                ticketId
                            )
                        ) {
                            return;
                        }

                        this.error.set(
                            mensajeApi(
                                err,
                                'No fue posible cargar los archivos.'
                            )
                        );

                        this.loading.set(false);
                    },
                });

            // ======================================
            // LIMPIEZA
            // ======================================

            onCleanup(() => {

                sub.unsubscribe();

                this.operacionSub?.unsubscribe();

                this.operacionSub = null;
            });
        });
    }

    // ==========================================
    // VALIDAR CONTEXTO ACTUAL
    // ==========================================

    private contextoValido(
        empresaId: string,
        ticketId: string
    ): boolean {

        return (
            this.empresa.empresaId === empresaId &&
            this.ticketId() === ticketId
        );
    }

    // ==========================================
    // INICIAR OPERACION
    // ==========================================

    private iniciarOperacion(
        tipo: OperacionArchivo,
        archivoId: string | null = null
    ): boolean {

        if (
            this.procesando() ||
            this.loading() ||
            !this.empresa.empresaId ||
            !this.ticketId()
        ) {
            return false;
        }

        this.operacion.set(tipo);

        this.archivoProcesandoId.set(archivoId);

        this.error.set(null);
        this.mensaje.set(null);

        return true;
    }

    // ==========================================
    // FINALIZAR OPERACION
    // ==========================================

    private finalizarOperacion(): void {

        this.operacion.set(null);

        this.archivoProcesandoId.set(null);

        this.operacionSub = null;
    }

    // ==========================================
    // EJECUTAR OPERACION CON RECARGA
    // ==========================================

    private ejecutarConRecarga(
        peticion: Observable<unknown>,
        mensajeExito: string,
        mensajeError: string
    ): void {

        const empresaId = this.empresa.empresaId;
        const ticketId = this.ticketId();

        if (!empresaId || !ticketId) {
            this.finalizarOperacion();
            return;
        }

        const req = ++this.solicitud;

        this.operacionSub = peticion.pipe(

            // Después de subir o eliminar,
            // consultar nuevamente el listado.

            switchMap(() =>
                this.service.getAll(ticketId)
            )

        ).subscribe({

            next: archivos => {

                if (
                    req !== this.solicitud ||
                    !this.contextoValido(
                        empresaId,
                        ticketId
                    )
                ) {
                    return;
                }

                this.archivos.set(archivos);

                this.mensaje.set(mensajeExito);

                this.finalizarOperacion();
            },

            error: err => {

                if (
                    req !== this.solicitud ||
                    !this.contextoValido(
                        empresaId,
                        ticketId
                    )
                ) {
                    return;
                }

                this.error.set(
                    mensajeApi(
                        err,
                        mensajeError
                    )
                );

                this.finalizarOperacion();
            },
        });
    }

    // ==========================================
    // SELECCIONAR ARCHIVO
    // ==========================================

    protected seleccionarArchivo(
        event: Event
    ): void {

        const inputElement =
            event.target as HTMLInputElement;

        const archivo =
            inputElement.files?.[0];

        inputElement.value = '';

        if (!archivo) {
            return;
        }

        if (
            !this.puedeSubir() ||
            this.procesando() ||
            this.loading()
        ) {
            return;
        }

        // ======================================
        // VALIDAR EXTENSION
        // ======================================

        const extension =
            archivo.name.substring(
                archivo.name.lastIndexOf('.')
            ).toLowerCase();

        if (
            !this.extensionesPermitidas.includes(
                extension
            )
        ) {
            this.error.set(
                'Formato no permitido. Utiliza JPG, PNG, WEBP o PDF.'
            );

            return;
        }

        // ======================================
        // VALIDAR TAMAÑO
        // ======================================

        if (archivo.size === 0) {

            this.error.set(
                'El archivo seleccionado está vacío.'
            );

            return;
        }

        if (archivo.size > this.maximoBytes) {

            this.error.set(
                'El archivo supera el tamaño máximo de 10 MB.'
            );

            return;
        }

        // ======================================
        // INICIAR CARGA
        // ======================================

        if (!this.iniciarOperacion('SUBIENDO')) {
            return;
        }

        const ticketId = this.ticketId();

        this.ejecutarConRecarga(

            this.service.subir(
                ticketId,
                archivo
            ),

            'Archivo adjuntado correctamente.',

            'No fue posible subir el archivo.'
        );
    }

    // ==========================================
    // DESCARGAR ARCHIVO
    // ==========================================

    protected descargar(
        archivo: TicketAdjunto
    ): void {

        if (
            !this.iniciarOperacion(
                'DESCARGANDO',
                archivo.id
            )
        ) {
            return;
        }

        const empresaId = this.empresa.empresaId;
        const ticketId = this.ticketId();

        if (!empresaId || !ticketId) {
            this.finalizarOperacion();
            return;
        }

        const req = ++this.solicitud;

        this.operacionSub = this.service
            .descargar(
                ticketId,
                archivo.id
            )
            .subscribe({

                next: blob => {

                    if (
                        req !== this.solicitud ||
                        !this.contextoValido(
                            empresaId,
                            ticketId
                        )
                    ) {
                        return;
                    }

                    // ==================================
                    // GENERAR DESCARGA
                    // ==================================

                    const url =
                        URL.createObjectURL(blob);

                    const enlace =
                        document.createElement('a');

                    enlace.href = url;

                    enlace.download =
                        archivo.nombreOriginal;

                    document.body.appendChild(enlace);

                    enlace.click();

                    enlace.remove();

                    // Liberar URL temporal.

                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                    }, 1000);

                    this.finalizarOperacion();
                },

                error: err => {

                    if (
                        req !== this.solicitud ||
                        !this.contextoValido(
                            empresaId,
                            ticketId
                        )
                    ) {
                        return;
                    }

                    this.error.set(
                        mensajeApi(
                            err,
                            'No fue posible descargar el archivo.'
                        )
                    );

                    this.finalizarOperacion();
                },
            });
    }

    // ==========================================
    // ELIMINAR ARCHIVO
    // ==========================================

    protected eliminar(
        archivo: TicketAdjunto
    ): void {

        if (
            !this.puedeEliminar(archivo) ||
            this.procesando() ||
            this.loading()
        ) {
            return;
        }

        const confirmar = window.confirm(
            `¿Deseas eliminar el archivo "${archivo.nombreOriginal}"?`
        );

        if (!confirmar) {
            return;
        }

        if (
            !this.iniciarOperacion(
                'ELIMINANDO',
                archivo.id
            )
        ) {
            return;
        }

        const ticketId = this.ticketId();

        this.ejecutarConRecarga(

            this.service.eliminar(
                ticketId,
                archivo.id
            ),

            'Archivo eliminado correctamente.',

            'No fue posible eliminar el archivo.'
        );
    }

    // ==========================================
    // PERMISO PARA ELIMINAR
    // ==========================================

    protected puedeEliminar(
        archivo: TicketAdjunto
    ): boolean {

        // Administradores:
        // Pueden eliminar archivos,
        // incluso de tickets cerrados.

        if (this.esAdministrador()) {
            return true;
        }

        // Operadores:
        // No pueden eliminar archivos
        // de tickets cerrados.

        if (
            !this.puedeOperar() ||
            this.ticketCerrado()
        ) {
            return false;
        }

        // ======================================
        // USUARIO INTERNO
        // ======================================

        const usuarioId =
            this.auth.user()?.usuarioId;

        if (!usuarioId) {
            return false;
        }

        return (
            archivo.usuarioCreacion?.toLowerCase() ===
            usuarioId.toLowerCase()
        );
    }

    // ==========================================
    // FORMATO DE ARCHIVO
    // ==========================================

    protected esImagen(
        archivo: TicketAdjunto
    ): boolean {

        return archivo.mimeType.startsWith(
            'image/'
        );
    }

    protected esPdf(
        archivo: TicketAdjunto
    ): boolean {

        return archivo.mimeType ===
            'application/pdf';
    }

    // ==========================================
    // TAMAÑO
    // ==========================================

    protected tamanoMb(
        bytes: number
    ): number {

        return bytes / (1024 * 1024);
    }
}