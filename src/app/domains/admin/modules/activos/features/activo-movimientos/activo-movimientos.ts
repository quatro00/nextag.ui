import { DatePipe } from '@angular/common';

import {
    Component,
    computed,
    effect,
    inject,
    input,
    signal,
} from '@angular/core';

import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { firstValueFrom, forkJoin } from 'rxjs';

import { EmpresaContextoService } from
    '@/app/core/empresa-contexto.service';

import { ActivoMovimientosService } from
    '../../../activo-movimientos/services/activo-movimientos.service';

import {
    ActivoMovimiento,
    ActivoSituacion,
} from '../../../activo-movimientos/types/activo-movimiento.types';

import { mensajeApi } from '../../../shared/api-error';

@Component({
    selector: 'app-activo-movimientos',
    templateUrl: './activo-movimientos.html',
    imports: [
        DatePipe,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
    ],
})
export class ActivoMovimientos {

    // ==========================================
    // INPUTS
    // ==========================================

    readonly activoId = input.required<string>();

    readonly activoEstadoId = input(1);

    readonly puedeGestionar = input(false);

    // ==========================================
    // SERVICIOS
    // ==========================================

    protected readonly empresa =
        inject(EmpresaContextoService);

    private readonly service =
        inject(ActivoMovimientosService);

    private readonly router = inject(Router);

    // ==========================================
    // ESTADO
    // ==========================================

    private solicitud = 0;

    protected readonly historial =
        signal<ActivoMovimiento[]>([]);

    protected readonly situacion =
        signal<ActivoSituacion | null>(null);

    protected readonly cargando = signal(false);

    protected readonly error =
        signal<string | null>(null);

    // ==========================================
    // COMPUTED
    // ==========================================

    protected readonly totalMovimientos = computed(() =>
        this.historial().length
    );

    protected readonly ultimaActividad = computed(() =>
        this.historial()[0] ?? null
    );

    protected readonly puedeMover = computed(() =>
        this.puedeGestionar() &&
        this.activoEstadoId() !== 7
    );

    protected readonly estaFuera = computed(() =>
        this.situacion()?.estaFuera === true
    );

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    constructor() {

        effect((onCleanup) => {

            const empresaId =
                this.empresa.seleccionada()?.id ?? null;

            const activoId = this.activoId();

            const req = ++this.solicitud;

            this.historial.set([]);
            this.situacion.set(null);

            this.error.set(null);

            this.cargando.set(!!empresaId && !!activoId);

            if (!empresaId || !activoId) {
                return;
            }

            const sub = forkJoin({

                situacion:
                    this.service.getSituacionActivo(activoId),

                historial:
                    this.service.getHistorialActivo(activoId),

            }).subscribe({

                next: datos => {

                    if (
                        req !== this.solicitud ||
                        this.empresa.empresaId !== empresaId ||
                        this.activoId() !== activoId
                    ) {
                        return;
                    }

                    this.situacion.set(datos.situacion);

                    this.historial.set(datos.historial);

                    this.cargando.set(false);
                },

                error: err => {

                    if (
                        req !== this.solicitud ||
                        this.empresa.empresaId !== empresaId ||
                        this.activoId() !== activoId
                    ) {
                        return;
                    }

                    this.error.set(
                        mensajeApi(
                            err,
                            'No fue posible consultar los movimientos del activo.'
                        )
                    );

                    this.cargando.set(false);
                },
            });

            onCleanup(() => sub.unsubscribe());

        });
    }

    // ==========================================
    // NUEVO MOVIMIENTO
    // ==========================================

    protected nuevoMovimiento(): void {

        if (!this.puedeMover()) {
            return;
        }

        void this.router.navigate(
            ['/admin/movimientos/nuevo'],
            {
                queryParams: {
                    activoId: this.activoId(),
                },
            }
        );
    }

    // ==========================================
    // VER MOVIMIENTO
    // ==========================================

    protected verMovimiento(id: string): void {

        void this.router.navigate([
            '/admin/movimientos',
            id,
        ]);
    }

    // ==========================================
    // VER TODOS
    // ==========================================

    protected verTodos(): void {
        void this.router.navigate(
            ['/admin/movimientos'],
            {
                queryParams: {
                    activoId: this.activoId(),
                },
            }
        );
    }

    // ==========================================
    // FORMATO DE UBICACION
    // ==========================================

    protected ubicacionOrigen(
        movimiento: ActivoMovimiento
    ): string {

        if (movimiento.esOrigenExterno) {
            return movimiento.origenExternoNombre
                || 'Ubicación externa';
        }

        const partes = [
            movimiento.sucursalOrigenNombre,
            movimiento.ubicacionOrigenNombre,
        ].filter(Boolean);

        return partes.join(' — ') || 'Sin ubicación';
    }

    protected ubicacionDestino(
        movimiento: ActivoMovimiento
    ): string {

        if (movimiento.esDestinoExterno) {
            return movimiento.destinoExternoNombre
                || 'Ubicación externa';
        }

        const partes = [
            movimiento.sucursalDestinoNombre,
            movimiento.ubicacionDestinoNombre,
        ].filter(Boolean);

        return partes.join(' — ') || 'Sin ubicación';
    }

    // ==========================================
    // RECARGAR
    // ==========================================

    protected async recargar(): Promise<void> {

        const empresaId = this.empresa.empresaId;

        const activoId = this.activoId();

        if (!empresaId || !activoId) {
            return;
        }

        const req = ++this.solicitud;

        this.cargando.set(true);
        this.error.set(null);

        try {

            const datos = await firstValueFrom(
                forkJoin({

                    situacion:
                        this.service.getSituacionActivo(activoId),

                    historial:
                        this.service.getHistorialActivo(activoId),

                })
            );

            if (
                req !== this.solicitud ||
                this.empresa.empresaId !== empresaId ||
                this.activoId() !== activoId
            ) {
                return;
            }

            this.situacion.set(datos.situacion);

            this.historial.set(datos.historial);

        } catch (err) {

            if (
                req === this.solicitud &&
                this.empresa.empresaId === empresaId &&
                this.activoId() === activoId
            ) {
                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible actualizar los movimientos.'
                    )
                );
            }

        } finally {

            if (req === this.solicitud) {
                this.cargando.set(false);
            }
        }
    }
}