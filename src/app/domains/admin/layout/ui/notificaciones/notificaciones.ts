import {
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';

import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { catchError, of, switchMap, timer } from 'rxjs';

import { EmpresaContextoService } from
    '@/app/core/empresa-contexto.service';

import { AuthService } from
    '@/app/domains/auth/services/auth.services';

import { NotificacionesService } from
    '@/app/domains/admin/modules/shared/notificaciones/notificaciones.service';

import { Notificacion } from
    '@/app/domains/admin/modules/shared/notificaciones/notificaciones.types';

@Component({
    selector: 'admin-notificaciones',
    standalone: true,

    imports: [
        DatePipe,
        MatButtonModule,
        MatBadgeModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
    ],

    templateUrl: './notificaciones.html',
})
export class AdminNotificaciones {

    private readonly service =
        inject(NotificacionesService);

    private readonly router =
        inject(Router);

    private readonly empresaContexto =
        inject(EmpresaContextoService);

    private readonly authService =
        inject(AuthService);

    // ==========================================
    // ESTADOS
    // ==========================================

    protected readonly notificaciones =
        signal<Notificacion[]>([]);

    protected readonly noLeidas =
        signal<number>(0);

    protected readonly cargando =
        signal<boolean>(false);

    protected readonly procesando =
        signal<boolean>(false);

    protected readonly error =
        signal<string | null>(null);

    protected readonly tieneNotificaciones =
        computed(() =>
            this.notificaciones().length > 0
        );

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    constructor() {

        // ======================================
        // ACTUALIZACION AUTOMATICA
        // ======================================

        effect((onCleanup) => {

            const empresaId =
                this.empresaContexto.seleccionada()?.id;

            const usuarioId =
                this.authService.user()?.id;

            // Reiniciar al cambiar de empresa
            // o de usuario.

            this.notificaciones.set([]);
            this.noLeidas.set(0);
            this.error.set(null);

            if (!empresaId || !usuarioId) {
                return;
            }

            // Consultar inmediatamente y después
            // cada 60 segundos.

            const subscription = timer(
                0,
                60000
            )
                .pipe(
                    switchMap(() =>
                        this.service.contarNoLeidas().pipe(
                            catchError(() => of(null))
                        )
                    )
                )
                .subscribe(resultado => {

                    // Evitar actualizar información
                    // si cambió la empresa.

                    if (
                        this.empresaContexto.empresaId
                        !== empresaId
                    ) {
                        return;
                    }

                    if (
                        this.authService.user()?.id
                        !== usuarioId
                    ) {
                        return;
                    }

                    if (resultado) {
                        this.noLeidas.set(
                            resultado.noLeidas
                        );
                    }
                });

            // Cancelar consultas anteriores
            // al cambiar de empresa o destruir
            // el componente.

            onCleanup(() => {
                subscription.unsubscribe();
            });
        });
    }

    // ==========================================
    // ABRIR MENU
    // ==========================================

    protected abrirMenu(): void {
        this.cargarNotificaciones();
    }

    // ==========================================
    // CARGAR NOTIFICACIONES
    // ==========================================

    protected cargarNotificaciones(): void {

        const empresaId =
            this.empresaContexto.empresaId;

        const usuarioId =
            this.authService.user()?.id;

        if (!empresaId || !usuarioId) {
            return;
        }

        this.cargando.set(true);
        this.error.set(null);

        this.service.obtener({
            pagina: 1,
            tamanoPagina: 10,
        })
            .subscribe({

                next: resultado => {

                    if (
                        this.empresaContexto.empresaId
                        !== empresaId ||
                        this.authService.user()?.id
                        !== usuarioId
                    ) {
                        return;
                    }

                    this.notificaciones.set(
                        resultado.items
                    );

                    this.cargando.set(false);
                },

                error: () => {

                    if (
                        this.empresaContexto.empresaId
                        !== empresaId ||
                        this.authService.user()?.id
                        !== usuarioId
                    ) {
                        return;
                    }

                    this.error.set(
                        'No fue posible cargar las notificaciones.'
                    );

                    this.cargando.set(false);
                },
            });
    }

    // ==========================================
    // ABRIR NOTIFICACION
    // ==========================================

    protected abrirNotificacion(
        notificacion: Notificacion
    ): void {

        if (this.procesando()) {
            return;
        }

        const empresaId =
            this.empresaContexto.empresaId;

        const usuarioId =
            this.authService.user()?.id;

        if (!empresaId || !usuarioId) {
            return;
        }

        this.procesando.set(true);

        this.service.marcarLeida(
            notificacion.id
        )
            .subscribe({

                next: () => {

                    if (
                        this.empresaContexto.empresaId
                        !== empresaId ||
                        this.authService.user()?.id
                        !== usuarioId
                    ) {
                        this.procesando.set(false);
                        return;
                    }

                    if (!notificacion.leida) {

                        this.noLeidas.update(
                            valor => Math.max(0, valor - 1)
                        );
                    }

                    this.notificaciones.update(lista =>
                        lista.map(x =>
                            x.id === notificacion.id
                                ? {
                                    ...x,
                                    leida: true,
                                    fechaLectura:
                                        new Date().toISOString()
                                }
                                : x
                        )
                    );

                    this.procesando.set(false);

                    // Navegar únicamente mediante
                    // una ruta interna construida
                    // a partir del TicketId.

                    if (notificacion.ticketId) {

                        void this.router.navigate([
                            '/admin/tickets',
                            notificacion.ticketId
                        ]);
                    }
                },

                error: () => {

                    if (
                        this.empresaContexto.empresaId
                        === empresaId &&
                        this.authService.user()?.id
                        === usuarioId
                    ) {
                        this.error.set(
                            'No fue posible marcar la notificación como leída.'
                        );
                    }

                    this.procesando.set(false);
                },
            });
    }

    // ==========================================
    // MARCAR TODAS COMO LEIDAS
    // ==========================================

    protected marcarTodas(): void {

        if (this.procesando()) {
            return;
        }

        const empresaId =
            this.empresaContexto.empresaId;

        const usuarioId =
            this.authService.user()?.id;

        if (!empresaId || !usuarioId) {
            return;
        }

        this.procesando.set(true);
        this.error.set(null);

        this.service.marcarTodasLeidas()
            .subscribe({

                next: () => {

                    if (
                        this.empresaContexto.empresaId
                        !== empresaId ||
                        this.authService.user()?.id
                        !== usuarioId
                    ) {
                        this.procesando.set(false);
                        return;
                    }

                    this.noLeidas.set(0);

                    this.notificaciones.update(lista =>
                        lista.map(x => ({
                            ...x,
                            leida: true,
                            fechaLectura:
                                x.fechaLectura ??
                                new Date().toISOString()
                        }))
                    );

                    this.procesando.set(false);
                },

                error: () => {

                    if (
                        this.empresaContexto.empresaId
                        === empresaId &&
                        this.authService.user()?.id
                        === usuarioId
                    ) {
                        this.error.set(
                            'No fue posible actualizar las notificaciones.'
                        );
                    }

                    this.procesando.set(false);
                },
            });
    }

    // ==========================================
    // ICONO SEGUN EVENTO
    // ==========================================

    protected obtenerIcono(
        eventoClave: string
    ): string {

        switch (eventoClave) {

            case 'TICKET_CREADO':
                return 'ticket';

            case 'TICKET_ASIGNADO':
                return 'user-check';

            case 'TICKET_REASIGNADO':
                return 'users';

            case 'TICKET_COMENTARIO':
                return 'message-square';

            case 'TICKET_RESUELTO':
                return 'circle-check';

            case 'TICKET_CERRADO':
                return 'circle-check';

            case 'TICKET_CANCELADO':
                return 'circle-x';

            default:
                return 'bell';
        }
    }
}