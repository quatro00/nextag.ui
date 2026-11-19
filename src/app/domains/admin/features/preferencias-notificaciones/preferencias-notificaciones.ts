import {
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';

import {
    DatePipe,
} from '@angular/common';

import {
    MatButtonModule,
} from '@angular/material/button';

import {
    MatIconModule,
} from '@angular/material/icon';

import {
    MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';

import {
    MatSlideToggleModule,
} from '@angular/material/slide-toggle';

import {
    MatCheckboxModule,
} from '@angular/material/checkbox';

import {
    EmpresaContextoService,
} from '@/app/core/empresa-contexto.service';

import {
    AuthService,
} from '@/app/domains/auth/services/auth.services';

import {
    NotificacionPreferenciasService,
} from '../../modules/shared/notificaciones/notificacion-preferencias.service';

import {
    NotificacionPreferenciaEdicion,
    NotificacionPreferenciaGuardar,
} from '../../modules/shared/notificaciones/notificacion-preferencias.types';

import {
    mensajeApi,
} from '../../modules/shared/api-error';


@Component({
    selector: 'app-preferencias-notificaciones',

    standalone: true,

    imports: [
        DatePipe,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        MatCheckboxModule,
    ],

    templateUrl: './preferencias-notificaciones.html',
})
export default class PreferenciasNotificaciones {

    private readonly service =
        inject(NotificacionPreferenciasService);

    protected readonly empresa =
        inject(EmpresaContextoService);

    private readonly auth =
        inject(AuthService);

    // ==========================================
    // CONFIGURACION
    // ==========================================

    protected readonly versionAvisoWhatsapp = 'v1';

    // ==========================================
    // ESTADOS
    // ==========================================

    protected readonly preferencias =
        signal<NotificacionPreferenciaEdicion[]>([]);

    protected readonly cargando =
        signal<boolean>(false);

    protected readonly error =
        signal<string | null>(null);

    protected readonly mensaje =
        signal<string | null>(null);

    protected readonly tienePreferencias =
        computed(() =>
            this.preferencias().length > 0
        );

    private solicitud = 0;

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    constructor() {

        effect((onCleanup) => {

            const empresaId =
                this.empresa.seleccionada()?.id;

            const usuarioId =
                this.auth.user()?.id;

            const solicitud = ++this.solicitud;

            this.preferencias.set([]);

            this.error.set(null);

            this.mensaje.set(null);

            this.cargando.set(
                !!empresaId && !!usuarioId
            );

            if (!empresaId || !usuarioId) {
                return;
            }

            const sub = this.service.obtener()
                .subscribe({

                    next: resultado => {

                        if (
                            solicitud !== this.solicitud ||
                            this.empresa.empresaId !== empresaId ||
                            this.auth.user()?.id !== usuarioId
                        ) {
                            return;
                        }

                        this.preferencias.set(
                            resultado.map(item => ({
                                ...item,
                                modificada: false,
                                guardando: false,
                            }))
                        );

                        this.cargando.set(false);
                    },

                    error: err => {

                        if (
                            solicitud !== this.solicitud ||
                            this.empresa.empresaId !== empresaId ||
                            this.auth.user()?.id !== usuarioId
                        ) {
                            return;
                        }

                        this.error.set(
                            mensajeApi(
                                err,
                                'No fue posible cargar las preferencias.'
                            )
                        );

                        this.cargando.set(false);
                    },
                });

            onCleanup(() => sub.unsubscribe());
        });
    }

    protected readonly guardandoAlguna = computed(() =>
        this.preferencias().some(x => x.guardando)
    );

    // ==========================================
    // ACTUALIZAR CANAL
    // ==========================================

    protected cambiarCanal(
        eventoId: number,
        canal: 'interna' | 'correo' | 'whatsapp',
        valor: boolean
    ): void {

        this.mensaje.set(null);
        this.error.set(null);

        this.preferencias.update(lista =>
            lista.map(item => {

                if (
                    item.eventoId !== eventoId ||
                    item.guardando
                ) {
                    return item;
                }

                // No permitir activar correo
                // sin dirección registrada.

                if (
                    canal === 'correo' &&
                    valor &&
                    !item.correoDisponible
                ) {
                    return item;
                }

                // No permitir activar WhatsApp
                // sin teléfono registrado.

                if (
                    canal === 'whatsapp' &&
                    valor &&
                    !item.whatsappDisponible
                ) {
                    return item;
                }

                const actualizado = {
                    ...item,
                    [canal]: valor,
                    modificada: true,
                };

                if (canal === 'whatsapp') {

                    // Al activar WhatsApp se exigirá
                    // una aceptación explícita.
                    //
                    // Si el consentimiento anterior
                    // sigue vigente, se conserva.

                    if (!valor) {

                        actualizado.consentimientoWhatsapp =
                            false;

                        actualizado.fechaConsentimientoWhatsapp =
                            null;

                        actualizado.versionAviso = null;

                    } else {

                        const consentimientoVigente =
                            item.consentimientoWhatsapp &&
                            !!item.fechaConsentimientoWhatsapp &&
                            item.versionAviso ===
                            this.versionAvisoWhatsapp;

                        actualizado.consentimientoWhatsapp =
                            consentimientoVigente;

                        actualizado.versionAviso =
                            consentimientoVigente
                                ? this.versionAvisoWhatsapp
                                : null;
                    }
                }

                return actualizado;
            })
        );
    }

    // ==========================================
    // CAMBIAR CONSENTIMIENTO
    // ==========================================

    protected cambiarConsentimiento(
        eventoId: number,
        aceptado: boolean
    ): void {

        this.preferencias.update(lista =>
            lista.map(item => {

                if (
                    item.eventoId !== eventoId ||
                    item.guardando ||
                    !item.whatsapp
                ) {
                    return item;
                }

                return {
                    ...item,

                    consentimientoWhatsapp: aceptado,

                    versionAviso: aceptado
                        ? this.versionAvisoWhatsapp
                        : null,

                    fechaConsentimientoWhatsapp:
                        aceptado &&
                            item.versionAviso ===
                            this.versionAvisoWhatsapp
                            ? item.fechaConsentimientoWhatsapp
                            : null,

                    modificada: true,
                };
            })
        );
    }

    // ==========================================
    // GUARDAR
    // ==========================================

    protected guardar(
        item: NotificacionPreferenciaEdicion
    ): void {

        if (
            this.cargando() ||
            item.guardando ||
            !item.modificada
        ) {
            return;
        }

        if (
            item.whatsapp &&
            !item.consentimientoWhatsapp
        ) {

            this.error.set(
                'Debes aceptar el aviso para recibir notificaciones por WhatsApp.'
            );

            return;
        }

        const empresaId =
            this.empresa.empresaId;

        const usuarioId =
            this.auth.user()?.id;

        if (!empresaId || !usuarioId) {
            return;
        }

        const solicitud = this.solicitud;

        const dto: NotificacionPreferenciaGuardar = {

            interna: item.interna,

            correo: item.correo,

            whatsapp: item.whatsapp,

            consentimientoWhatsapp:
                item.whatsapp &&
                item.consentimientoWhatsapp,

            versionAviso:
                item.whatsapp &&
                    item.consentimientoWhatsapp
                    ? this.versionAvisoWhatsapp
                    : null,
        };

        this.error.set(null);
        this.mensaje.set(null);

        this.preferencias.update(lista =>
            lista.map(x =>
                x.eventoId === item.eventoId
                    ? { ...x, guardando: true }
                    : x
            )
        );

        this.service.guardar(
            item.eventoId,
            dto
        ).subscribe({

            next: resultado => {

                if (
                    solicitud !== this.solicitud ||
                    this.empresa.empresaId !== empresaId ||
                    this.auth.user()?.id !== usuarioId
                ) {
                    return;
                }

                this.preferencias.update(lista =>
                    lista.map(x =>
                        x.eventoId === item.eventoId
                            ? {
                                ...resultado,
                                modificada: false,
                                guardando: false,
                            }
                            : x
                    )
                );

                this.mensaje.set(
                    `Preferencias de "${resultado.eventoNombre}" guardadas correctamente.`
                );
            },

            error: err => {

                if (
                    solicitud !== this.solicitud ||
                    this.empresa.empresaId !== empresaId ||
                    this.auth.user()?.id !== usuarioId
                ) {
                    return;
                }

                this.preferencias.update(lista =>
                    lista.map(x =>
                        x.eventoId === item.eventoId
                            ? {
                                ...x,
                                guardando: false,
                            }
                            : x
                    )
                );

                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible guardar las preferencias.'
                    )
                );
            },
        });
    }

    // ==========================================
    // DESCARTAR CAMBIOS
    // ==========================================

    protected recargar(): void {

        if (this.cargando() || this.guardandoAlguna()) {
            return;
        }

        const empresaId = this.empresa.empresaId;
        const usuarioId = this.auth.user()?.id;

        if (!empresaId || !usuarioId) {
            return;
        }

        const solicitud = ++this.solicitud;

        this.cargando.set(true);

        this.error.set(null);

        this.mensaje.set(null);

        this.service.obtener().subscribe({

            next: resultado => {

                if (
                    solicitud !== this.solicitud ||
                    this.empresa.empresaId !== empresaId ||
                    this.auth.user()?.id !== usuarioId
                ) {
                    return;
                }

                this.preferencias.set(
                    resultado.map(x => ({
                        ...x,
                        modificada: false,
                        guardando: false,
                    }))
                );

                this.cargando.set(false);
            },

            error: err => {

                if (
                    solicitud !== this.solicitud ||
                    this.empresa.empresaId !== empresaId ||
                    this.auth.user()?.id !== usuarioId
                ) {
                    return;
                }

                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible actualizar las preferencias.'
                    )
                );

                this.cargando.set(false);
            },
        });
    }
}