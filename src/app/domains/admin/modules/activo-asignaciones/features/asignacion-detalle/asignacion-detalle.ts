import {
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import {
    firstValueFrom,
    forkJoin,
    switchMap,
    of,
} from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { ResponsablesService } from '../../../responsables/services/responsables.service';
import { Responsable } from '../../../responsables/types/responsable.types';
import { mensajeApi } from '../../../shared/api-error';
import { ActivoAsignacionesService } from '../../services/activo-asignaciones.service';
import {
    ActivoAsignacion,
    ActivoAsignacionDevolver,
    ActivoAsignacionReasignar,
} from '../../types/activo-asignacion.types';

@Component({
    selector: 'app-asignacion-detalle',
    templateUrl: './asignacion-detalle.html',
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
    ],
})
export default class AsignacionDetalle {

    protected readonly empresa = inject(EmpresaContextoService);

    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly fb = inject(FormBuilder);

    private readonly service = inject(ActivoAsignacionesService);
    private readonly responsablesService = inject(ResponsablesService);

    private readonly auth = inject(AuthService);

    protected readonly id = signal<string | null>(null);

    protected readonly detalle =
        signal<ActivoAsignacion | null>(null);

    protected readonly responsables =
        signal<Responsable[]>([]);

    protected readonly loading = signal(false);
    protected readonly guardando = signal(false);

    protected readonly error = signal<string | null>(null);
    protected readonly exito = signal<string | null>(null);

    protected readonly accion =
        signal<'ninguna' | 'devolver' | 'reasignar'>('ninguna');

    protected readonly puedeGestionar = computed(() =>
        this.auth.hasAnyRole([
            AUTH_ROLES.ADMINISTRADOR,
            AUTH_ROLES.ADMIN_EMPRESA,
        ])
    );

    protected readonly formDevolucion =
        this.fb.nonNullable.group({

            motivoDevolucion: [
                '',
                Validators.maxLength(300),
            ],

            condicionDevolucion: [
                '',
                Validators.maxLength(100),
            ],

            observacionesDevolucion: [
                '',
                Validators.maxLength(1000),
            ],
        });

    protected readonly formReasignacion =
        this.fb.nonNullable.group({

            nuevoResponsableId: ['', Validators.required],

            motivo: [
                '',
                Validators.maxLength(300),
            ],

            condicionDevolucion: [
                '',
                Validators.maxLength(100),
            ],

            observacionesDevolucion: [
                '',
                Validators.maxLength(1000),
            ],

            observacionesAsignacion: [
                '',
                Validators.maxLength(1000),
            ],
        });

    constructor() {

        effect((onCleanup) => {

            const empresaId =
                this.empresa.seleccionada()?.id ?? null;

            this.detalle.set(null);
            this.responsables.set([]);

            this.error.set(null);
            this.exito.set(null);

            this.accion.set('ninguna');

            this.id.set(null);

            this.loading.set(!!empresaId);

            if (!empresaId) {
                return;
            }

            const sub = this.route.paramMap
                .pipe(

                    switchMap(params => {

                        const asignacionId = params.get('id');

                        this.id.set(asignacionId);

                        this.detalle.set(null);
                        this.responsables.set([]);

                        this.error.set(null);
                        this.exito.set(null);

                        this.accion.set('ninguna');

                        this.formDevolucion.reset();
                        this.formReasignacion.reset();

                        if (!asignacionId) {
                            this.loading.set(false);
                            return of(null);
                        }

                        this.loading.set(true);

                        return forkJoin({

                            detalle:
                                this.service.getById(asignacionId),

                            responsables:
                                this.responsablesService.getAll({
                                    activo: true,
                                    pagina: 1,
                                    tamanoPagina: 100,
                                }),

                        });
                    })

                )
                .subscribe({

                    next: datos => {

                        if (
                            !datos ||
                            this.empresa.empresaId !== empresaId
                        ) {
                            return;
                        }

                        this.detalle.set(datos.detalle);

                        this.responsables.set(
                            datos.responsables.items.filter(
                                x => x.id !== datos.detalle.responsableId
                            )
                        );

                        this.loading.set(false);
                    },

                    error: err => {

                        if (this.empresa.empresaId !== empresaId) {
                            return;
                        }

                        this.error.set(
                            mensajeApi(
                                err,
                                'No fue posible cargar la asignación.'
                            )
                        );

                        this.loading.set(false);
                    },
                });

            onCleanup(() => sub.unsubscribe());

        });
    }

    protected mostrarDevolucion(): void {

        this.formDevolucion.reset();
        this.accion.set('devolver');

        this.error.set(null);
        this.exito.set(null);
    }

    protected mostrarReasignacion(): void {

        this.formReasignacion.reset();
        this.accion.set('reasignar');

        this.error.set(null);
        this.exito.set(null);
    }

    protected cancelarAccion(): void {
        this.accion.set('ninguna');
    }

    protected async devolver(): Promise<void> {

        const actual = this.detalle();

        if (
            !actual ||
            !actual.vigente ||
            !this.puedeGestionar() ||
            this.guardando()
        ) return;

        if (this.formDevolucion.invalid) {
            this.formDevolucion.markAllAsTouched();
            return;
        }

        if (!confirm('¿Confirmas la devolución del activo?')) {
            return;
        }

        const empresaId = this.empresa.empresaId;

        if (!empresaId) return;

        const f = this.formDevolucion.getRawValue();

        const dto: ActivoAsignacionDevolver = {

            fechaDevolucion: null,

            motivoDevolucion:
                f.motivoDevolucion.trim() || null,

            condicionDevolucion:
                f.condicionDevolucion.trim() || null,

            observacionesDevolucion:
                f.observacionesDevolucion.trim() || null,
        };

        this.guardando.set(true);
        this.error.set(null);

        try {

            const actualizado = await firstValueFrom(
                this.service.devolver(actual.id, dto)
            );

            if (this.empresa.empresaId !== empresaId) return;

            this.detalle.set(actualizado);
            this.accion.set('ninguna');

            this.exito.set(
                'Devolución registrada correctamente.'
            );

        } catch (err) {

            if (this.empresa.empresaId === empresaId) {
                this.error.set(
                    mensajeApi(err, 'No fue posible registrar la devolución.')
                );
            }

        } finally {

            this.guardando.set(false);
        }
    }

    protected async reasignar(): Promise<void> {

        const actual = this.detalle();

        if (
            !actual ||
            !actual.vigente ||
            !this.puedeGestionar() ||
            this.guardando()
        ) return;

        if (this.formReasignacion.invalid) {
            this.formReasignacion.markAllAsTouched();
            return;
        }

        const empresaId = this.empresa.empresaId;

        if (!empresaId) return;

        const f = this.formReasignacion.getRawValue();

        if (
            f.nuevoResponsableId === actual.responsableId
        ) {
            this.error.set(
                'Selecciona un responsable diferente.'
            );
            return;
        }

        const responsable = this.responsables().find(
            x => x.id === f.nuevoResponsableId
        );

        if (!responsable) {
            this.error.set('Selecciona un responsable válido.');
            return;
        }

        if (
            !confirm(
                `¿Deseas reasignar el activo a "${responsable.nombre}"?`
            )
        ) return;

        const dto: ActivoAsignacionReasignar = {

            nuevoResponsableId: f.nuevoResponsableId,

            fechaReasignacion: null,

            motivo: f.motivo.trim() || null,

            condicionDevolucion:
                f.condicionDevolucion.trim() || null,

            observacionesDevolucion:
                f.observacionesDevolucion.trim() || null,

            observacionesAsignacion:
                f.observacionesAsignacion.trim() || null,
        };

        this.guardando.set(true);
        this.error.set(null);

        try {

            const nueva = await firstValueFrom(
                this.service.reasignar(actual.id, dto)
            );

            if (this.empresa.empresaId === empresaId) {

                const navegado = await this.router.navigate([
                    '/admin/asignaciones',
                    nueva.id,
                ]);

                if (
                    navegado &&
                    this.empresa.empresaId === empresaId
                ) {
                    this.exito.set(
                        'Activo reasignado correctamente.'
                    );
                }
            }

        } catch (err) {

            if (this.empresa.empresaId === empresaId) {
                this.error.set(
                    mensajeApi(err, 'No fue posible reasignar el activo.')
                );
            }

        } finally {

            this.guardando.set(false);
        }
    }

    protected abrirActivo(): void {

        const activoId = this.detalle()?.activoId;

        if (!activoId) return;

        void this.router.navigate([
            '/admin/activos',
            activoId,
        ]);
    }

    protected abrirResponsable(): void {

        const responsableId = this.detalle()?.responsableId;

        if (!responsableId) return;

        void this.router.navigate([
            '/admin/responsables',
            responsableId,
        ]);
    }

    protected volver(): void {
        void this.router.navigate(['/admin/asignaciones']);
    }
}