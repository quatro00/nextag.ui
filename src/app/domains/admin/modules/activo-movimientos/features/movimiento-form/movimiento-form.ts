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
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom, forkJoin } from 'rxjs';
import { EmpresaContextoService } from
    '@/app/core/empresa-contexto.service';
import { ActivosService } from
    '../../../activos/services/activos.service';
import { ActivoList } from
    '../../../activos/types/activo.types';
import { SucursalesService } from
    '../../../sucursales/services/sucursales.service';
import { SucursalList } from
    '../../../sucursales/types/sucursal.types';
import { UbicacionesService } from
    '../../../ubicaciones/services/ubicaciones.service';
import { UbicacionList } from
    '../../../ubicaciones/types/ubicacion.types';
import { mensajeApi } from '../../../shared/api-error';
import { ActivoMovimientosService } from
    '../../services/activo-movimientos.service';
import { ActivoDetalle } from
    '../../../activos/types/activo.types';
import {
    ActivoMovimientoCrear,
    ActivoSituacion,
    TipoMovimientoActivo,
} from '../../types/activo-movimiento.types';

@Component({
    selector: 'app-movimiento-form',
    templateUrl: './movimiento-form.html',
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
export default class MovimientoForm {

    protected readonly empresa =
        inject(EmpresaContextoService);

    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    private readonly movimientosService =
        inject(ActivoMovimientosService);

    private readonly activosService =
        inject(ActivosService);

    private readonly sucursalesService =
        inject(SucursalesService);

    private readonly ubicacionesService =
        inject(UbicacionesService);

    protected readonly activos =
        signal<ActivoList[]>([]);

    protected readonly activoPrecargado =
        signal<ActivoDetalle | null>(null);

    protected readonly tipos =
        signal<TipoMovimientoActivo[]>([]);

    protected readonly sucursales =
        signal<SucursalList[]>([]);

    protected readonly ubicaciones =
        signal<UbicacionList[]>([]);

    protected readonly situacion =
        signal<ActivoSituacion | null>(null);

    protected readonly buscarActivo = signal('');

    protected readonly cargando = signal(false);
    protected readonly guardando = signal(false);

    protected readonly error =
        signal<string | null>(null);

    private solicitud = 0;
    private solicitudActivos = 0;
    private solicitudSituacion = 0;
    private solicitudUbicaciones = 0;

    protected readonly form = this.fb.nonNullable.group({

        activoId: ['', Validators.required],

        tipoMovimientoActivoId: [0, Validators.min(1)],

        sucursalDestinoId: [''],

        ubicacionDestinoId: [''],

        destinoExternoNombre: ['', Validators.maxLength(200)],

        destinoExternoDireccion: ['', Validators.maxLength(500)],

        motivo: ['', Validators.maxLength(300)],

        observaciones: ['', Validators.maxLength(1000)],
    });

    protected readonly tipoSeleccionado = computed(() =>
        this.tipos().find(
            x => x.id === this.formTipo()
        ) ?? null
    );

    private readonly formTipo = signal(0);

    protected readonly esSalida = computed(() =>
        [
            'SALIDA_TEMPORAL',
            'ENVIO_MANTENIMIENTO',
        ].includes(this.tipoSeleccionado()?.clave ?? '')
    );

    protected readonly esRetorno = computed(() =>
        [
            'RETORNO',
            'REGRESO_MANTENIMIENTO',
        ].includes(this.tipoSeleccionado()?.clave ?? '')
    );

    protected readonly esInterno = computed(() =>
        [
            'TRASLADO',
            'AJUSTE_UBICACION',
        ].includes(this.tipoSeleccionado()?.clave ?? '')
    );

    constructor() {

        effect((onCleanup) => {

            const empresaId =
                this.empresa.seleccionada()?.id ?? null;

            const req = ++this.solicitud;
            ++this.solicitudActivos;
            ++this.solicitudSituacion;
            ++this.solicitudUbicaciones;

            this.form.reset();

            this.formTipo.set(0);

            this.activoPrecargado.set(null);

            this.activos.set([]);
            this.tipos.set([]);
            this.sucursales.set([]);
            this.ubicaciones.set([]);

            this.situacion.set(null);

            this.buscarActivo.set('');

            this.error.set(null);
            this.cargando.set(!!empresaId);

            if (!empresaId) {
                return;
            }

            const sub = forkJoin({

                tipos: this.movimientosService.getTipos(),

                sucursales: this.sucursalesService.getAll(true),

            }).subscribe({

                next: datos => {

                    if (
                        req !== this.solicitud ||
                        this.empresa.empresaId !== empresaId
                    ) {
                        return;
                    }

                    this.tipos.set(datos.tipos);
                    this.sucursales.set(datos.sucursales);

                    this.cargando.set(false);

                    void this.cargarActivos();

                    const activoId =
                        this.route.snapshot.queryParamMap.get('activoId');

                    if (activoId) {
                        this.form.controls.activoId.setValue(activoId);
                        void this.precargarActivo(activoId, empresaId);
                        void this.cargarSituacion(activoId);
                    }
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
                            'No fue posible cargar el formulario.'
                        )
                    );

                    this.cargando.set(false);
                },
            });

            onCleanup(() => sub.unsubscribe());

        });
    }

    private async precargarActivo(
        activoId: string,
        empresaId: string
    ): Promise<void> {

        try {

            const activo = await firstValueFrom(
                this.activosService.getById(activoId)
            );

            if (
                this.empresa.empresaId !== empresaId ||
                this.form.controls.activoId.value !== activoId
            ) return;

            this.activoPrecargado.set(activo);

        } catch (err) {

            if (this.empresa.empresaId === empresaId) {
                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible recuperar el activo seleccionado.'
                    )
                );
            }
        }
    }

    protected cambiarBusqueda(event: Event): void {
        this.buscarActivo.set(
            (event.target as HTMLInputElement).value
        );
    }

    protected async cargarActivos(): Promise<void> {

        const empresaId = this.empresa.empresaId;

        if (!empresaId) return;

        const req = ++this.solicitudActivos;

        try {

            const resultado = await firstValueFrom(
                this.activosService.getAll({
                    buscar: this.buscarActivo() || undefined,
                    pagina: 1,
                    tamanoPagina: 100,
                })
            );

            if (
                this.empresa.empresaId !== empresaId ||
                req !== this.solicitudActivos
            ) return;

            this.activos.set(resultado.items);

        } catch (err) {

            if (
                this.empresa.empresaId === empresaId &&
                req === this.solicitudActivos
            ) {
                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible cargar los activos.'
                    )
                );
            }
        }
    }

    protected async seleccionarActivo(
        activoId: string
    ): Promise<void> {

        this.form.controls.activoId.setValue(activoId);

        this.activoPrecargado.set(null);
        this.situacion.set(null);

        ++this.solicitudSituacion;

        if (!activoId) return;

        await this.cargarSituacion(activoId);
    }

    private async cargarSituacion(
        activoId: string
    ): Promise<void> {

        const empresaId = this.empresa.empresaId;

        if (!empresaId) return;

        const req = ++this.solicitudSituacion;

        try {

            const resultado = await firstValueFrom(
                this.movimientosService.getSituacionActivo(activoId)
            );

            if (
                req !== this.solicitudSituacion ||
                this.empresa.empresaId !== empresaId ||
                this.form.controls.activoId.value !== activoId
            ) return;

            this.situacion.set(resultado);

        } catch (err) {

            if (
                req === this.solicitudSituacion &&
                this.empresa.empresaId === empresaId
            ) {
                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible consultar la ubicación del activo.'
                    )
                );
            }
        }
    }

    protected cambiarTipo(id: number): void {

        this.form.controls.tipoMovimientoActivoId.setValue(id);

        this.formTipo.set(id);

        this.error.set(null);

        this.form.patchValue({
            sucursalDestinoId: '',
            ubicacionDestinoId: '',
            destinoExternoNombre: '',
            destinoExternoDireccion: '',
        });

        this.ubicaciones.set([]);
    }

    protected cambiarSucursal(id: string): void {

        this.form.controls.sucursalDestinoId.setValue(id);

        this.form.controls.ubicacionDestinoId.setValue('');

        this.ubicaciones.set([]);

        if (id) {
            void this.cargarUbicaciones(id);
        }
    }

    private async cargarUbicaciones(
        sucursalId: string
    ): Promise<void> {

        const empresaId = this.empresa.empresaId;

        if (!empresaId) return;

        const req = ++this.solicitudUbicaciones;

        try {

            const items = await firstValueFrom(
                this.ubicacionesService.getAll(
                    sucursalId,
                    true
                )
            );

            if (
                req !== this.solicitudUbicaciones ||
                this.empresa.empresaId !== empresaId ||
                this.form.controls.sucursalDestinoId.value !== sucursalId
            ) return;

            this.ubicaciones.set(items);

        } catch (err) {

            if (
                req === this.solicitudUbicaciones &&
                this.empresa.empresaId === empresaId
            ) {
                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible cargar las ubicaciones.'
                    )
                );
            }
        }
    }

    protected async guardar(): Promise<void> {

        if (
            this.guardando() ||
            this.form.invalid ||
            !this.empresa.empresaId
        ) {
            this.form.markAllAsTouched();
            return;
        }

        const situacion = this.situacion();

        if (!situacion) {
            this.error.set('Selecciona un activo válido.');
            return;
        }

        const tipo = this.tipoSeleccionado();

        if (!tipo) {
            this.error.set('Selecciona el tipo de movimiento.');
            return;
        }

        if (situacion.estaFuera && !this.esRetorno()) {
            this.error.set(
                'El activo está fuera. Debes registrar primero su retorno.'
            );
            return;
        }

        if (!situacion.estaFuera && this.esRetorno()) {
            this.error.set(
                'El activo no tiene una salida pendiente.'
            );
            return;
        }

        if (this.esRetorno()) {

            const movimientoSalidaId =
                situacion.movimientoSalidaId;

            if (!movimientoSalidaId) {

                this.error.set(
                    'No se encontró el movimiento de salida pendiente.'
                );

                return;
            }

            try {

                const salida = await firstValueFrom(
                    this.movimientosService.getById(
                        movimientoSalidaId
                    )
                );

                const tipoEsperado =
                    salida.tipoMovimientoClave === 'SALIDA_TEMPORAL'
                        ? 'RETORNO'
                        : salida.tipoMovimientoClave === 'ENVIO_MANTENIMIENTO'
                            ? 'REGRESO_MANTENIMIENTO'
                            : null;

                if (
                    !tipoEsperado ||
                    tipo.clave !== tipoEsperado
                ) {

                    this.error.set(
                        'El tipo de retorno no corresponde con la salida registrada.'
                    );

                    return;
                }

            } catch (err) {

                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible validar la salida pendiente.'
                    )
                );

                return;
            }
        }

        const f = this.form.getRawValue();

        if (
            (this.esInterno() || this.esRetorno()) &&
            !f.sucursalDestinoId
        ) {
            this.error.set('Selecciona una sucursal destino.');
            return;
        }

        if (
            this.esSalida() &&
            !f.destinoExternoNombre.trim()
        ) {
            this.error.set('Indica el destino externo.');
            return;
        }

        const dto: ActivoMovimientoCrear = {

            activoId: f.activoId,

            tipoMovimientoActivoId:
                f.tipoMovimientoActivoId,

            sucursalDestinoId:
                this.esSalida()
                    ? null
                    : f.sucursalDestinoId || null,

            ubicacionDestinoId:
                this.esSalida()
                    ? null
                    : f.ubicacionDestinoId || null,

            destinoExternoNombre:
                this.esSalida()
                    ? f.destinoExternoNombre.trim() || null
                    : null,

            destinoExternoDireccion:
                this.esSalida()
                    ? f.destinoExternoDireccion.trim() || null
                    : null,

            proveedorDestinoId: null,

            movimientoOrigenId:
                this.esRetorno()
                    ? situacion.movimientoSalidaId
                    : null,

            estadoActivoDestinoId: null,

            motivo: f.motivo.trim() || null,

            observaciones:
                f.observaciones.trim() || null,

            tipoReferencia: null,

            referenciaId: null,
        };

        if (
            !confirm('¿Confirmas el registro del movimiento?')
        ) {
            return;
        }

        const empresaId = this.empresa.empresaId;

        this.guardando.set(true);
        this.error.set(null);

        try {

            const creado = await firstValueFrom(
                this.movimientosService.create(dto)
            );

            if (this.empresa.empresaId !== empresaId) return;

            await this.router.navigate([
                '/admin/movimientos',
                creado.id,
            ]);

        } catch (err) {

            if (this.empresa.empresaId === empresaId) {
                this.error.set(
                    mensajeApi(
                        err,
                        'No fue posible registrar el movimiento.'
                    )
                );
            }

        } finally {

            this.guardando.set(false);
        }
    }

    protected volver(): void {

        void this.router.navigate([
            '/admin/movimientos',
        ]);
    }
}