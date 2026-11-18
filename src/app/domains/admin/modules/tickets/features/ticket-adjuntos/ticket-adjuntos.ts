import {
    Component,
    computed,
    effect,
    inject,
    input,
    signal,
} from '@angular/core';

import { DatePipe, DecimalPipe } from '@angular/common';

import { firstValueFrom } from 'rxjs';

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

    protected readonly guardando = signal(false);

    protected readonly descargandoId =
        signal<string | null>(null);

    protected readonly eliminandoId =
        signal<string | null>(null);

    protected readonly error =
        signal<string | null>(null);

    protected readonly mensaje =
        signal<string | null>(null);

    private solicitud = 0;

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

            this.archivos.set([]);

            this.error.set(null);
            this.mensaje.set(null);

            this.loading.set(!!empresaId && !!ticketId);

            if (!empresaId || !ticketId) {
                return;
            }

            const sub = this.service
                .getAll(ticketId)
                .subscribe({

                    next: archivos => {

                        if (
                            req !== this.solicitud ||
                            this.empresa.empresaId !== empresaId
                        ) {
                            return;
                        }

                        this.archivos.set(archivos);

                        this.loading.set(false);
                    },

                    error: err => {

                        if (
                            req !== this.solicitud ||
                            this.empresa.empresaId !== empresaId
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

            onCleanup(() => sub.unsubscribe());
        });
    }

    // ==========================================
    // RECARGAR ARCHIVOS
    // ==========================================

    private async recargar(): Promise<void> {

        const empresaId = this.empresa.empresaId;
        const ticketId = this.ticketId();

        if (!empresaId || !ticketId) return;

        const req = ++this.solicitud;

        this.loading.set(true);

        try {

            const archivos = await firstValueFrom(
                this.service.getAll(ticketId)
            );

            if (
                req !== this.solicitud ||
                this.empresa.empresaId !== empresaId ||
                this.ticketId() !== ticketId
            ) {
                return;
            }

            this.archivos.set(archivos);

        } catch (err) {

            if (
                req === this.solicitud &&
                this.empresa.empresaId === empresaId
            ) {
                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible actualizar los archivos.'
                    )
                );
            }

        } finally {

            if (req === this.solicitud) {
                this.loading.set(false);
            }
        }
    }

    // ==========================================
    // SELECCIONAR Y SUBIR ARCHIVO
    // ==========================================

    protected async seleccionarArchivo(
        event: Event
    ): Promise<void> {

        const inputElement =
            event.target as HTMLInputElement;

        const archivo =
            inputElement.files?.[0];

        inputElement.value = '';

        if (!archivo) return;

        if (!this.puedeSubir() || this.guardando()) {
            return;
        }

        const extension =
            archivo.name.substring(
                archivo.name.lastIndexOf('.')
            ).toLowerCase();

        // ======================================
        // VALIDAR EXTENSION
        // ======================================

        if (
            !this.extensionesPermitidas.includes(extension)
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
        // GUARDAR
        // ======================================

        const empresaId = this.empresa.empresaId;
        const ticketId = this.ticketId();

        if (!empresaId || !ticketId) return;

        this.guardando.set(true);

        this.error.set(null);
        this.mensaje.set(null);

        try {

            await firstValueFrom(
                this.service.subir(
                    ticketId,
                    archivo
                )
            );

            if (
                this.empresa.empresaId !== empresaId ||
                this.ticketId() !== ticketId
            ) {
                return;
            }

            await this.recargar();

            this.mensaje.set(
                'Archivo adjuntado correctamente.'
            );

        } catch (err) {

            if (
                this.empresa.empresaId === empresaId &&
                this.ticketId() === ticketId
            ) {
                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible subir el archivo.'
                    )
                );
            }

        } finally {

            this.guardando.set(false);
        }
    }

    // ==========================================
    // DESCARGAR ARCHIVO
    // ==========================================

    protected async descargar(
        archivo: TicketAdjunto
    ): Promise<void> {

        if (this.descargandoId()) return;

        const empresaId = this.empresa.empresaId;
        const ticketId = this.ticketId();

        if (!empresaId || !ticketId) return;

        this.descargandoId.set(archivo.id);

        this.error.set(null);

        try {

            const blob = await firstValueFrom(
                this.service.descargar(
                    ticketId,
                    archivo.id
                )
            );

            if (
                this.empresa.empresaId !== empresaId ||
                this.ticketId() !== ticketId
            ) {
                return;
            }

            const url = URL.createObjectURL(blob);

            const enlace = document.createElement('a');

            enlace.href = url;

            enlace.download = archivo.nombreOriginal;

            document.body.appendChild(enlace);

            enlace.click();

            enlace.remove();

            // Liberar la URL después de iniciar
            // la descarga.

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

        } catch (err) {

            if (
                this.empresa.empresaId === empresaId &&
                this.ticketId() === ticketId
            ) {
                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible descargar el archivo.'
                    )
                );
            }

        } finally {

            this.descargandoId.set(null);
        }
    }

    // ==========================================
    // ELIMINAR ARCHIVO
    // ==========================================

    protected async eliminar(
        archivo: TicketAdjunto
    ): Promise<void> {

        if (
            !this.puedeEliminar(archivo) ||
            this.eliminandoId()
        ) {
            return;
        }

        const confirmar = window.confirm(
            `¿Deseas eliminar el archivo "${archivo.nombreOriginal}"?`
        );

        if (!confirmar) return;

        const empresaId = this.empresa.empresaId;
        const ticketId = this.ticketId();

        if (!empresaId || !ticketId) return;

        this.eliminandoId.set(archivo.id);

        this.error.set(null);
        this.mensaje.set(null);

        try {

            await firstValueFrom(
                this.service.eliminar(
                    ticketId,
                    archivo.id
                )
            );

            if (
                this.empresa.empresaId !== empresaId ||
                this.ticketId() !== ticketId
            ) {
                return;
            }

            await this.recargar();

            this.mensaje.set(
                'Archivo eliminado correctamente.'
            );

        } catch (err) {

            if (
                this.empresa.empresaId === empresaId &&
                this.ticketId() === ticketId
            ) {
                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible eliminar el archivo.'
                    )
                );
            }

        } finally {

            this.eliminandoId.set(null);
        }
    }

    // ==========================================
    // VALIDAR PERMISO DE ELIMINACION
    // ==========================================

    protected puedeEliminar(
        archivo: TicketAdjunto
    ): boolean {

        if (this.esAdministrador()) {
            return true;
        }

        if (!this.puedeOperar() || this.ticketCerrado()) {
            return false;
        }

        const usuarioId = this.auth.user()?.id;

        return !!usuarioId &&
            archivo.usuarioCreacion === usuarioId;
    }

    // ==========================================
    // FORMATO DE ARCHIVO
    // ==========================================

    protected esImagen(
        archivo: TicketAdjunto
    ): boolean {

        return archivo.mimeType.startsWith('image/');
    }

    protected esPdf(
        archivo: TicketAdjunto
    ): boolean {

        return archivo.mimeType === 'application/pdf';
    }

    // ==========================================
    // TAMAÑO EN MB
    // ==========================================

    protected tamanoMb(
        bytes: number
    ): number {

        return bytes / (1024 * 1024);
    }
}