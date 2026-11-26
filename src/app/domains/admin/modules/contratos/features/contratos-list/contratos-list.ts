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
    FormBuilder,
    ReactiveFormsModule,
} from '@angular/forms';
import {
    takeUntilDestroyed,
} from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
    MatPaginatorModule,
    PageEvent,
} from '@angular/material/paginator';
import {
    debounceTime,
    forkJoin,
    Subscription,
} from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { ClienteList } from '../../../clientes/types/cliente.types';
import { ProveedoresService } from '../../../proveedores/services/proveedores.service';
import { ProveedorList } from '../../../proveedores/types/proveedor.types';
import { TiposContratoService } from '../../../tipos-contrato/services/tipos-contrato.service';
import { TipoContratoList } from '../../../tipos-contrato/types/tipo-contrato.types';
import { ContratosService } from '../../services/contratos.service';
import { EstadosContratoService } from '../../services/estados-contrato.service';
import {
    ContratoFiltros,
    ContratoList,
} from '../../types/contrato.types';
import {
    EstadoContrato,
} from '../../types/estado-contrato.types';
import {
    ContratoIndicadores,
    ContratoIndicadorFiltro,
} from '../../types/contrato-indicadores.types';
import {
    ESTADOS_CONTRATO,
} from '../../constants/estados-contrato.constants';
import {
    CONTRATOS_CONFIG,
    CONTRATOS_OPCIONES_PAGINACION,
    CONTRATOS_OPCIONES_VENCIMIENTO,
} from '../../constants/contratos.constants';
import {
    obtenerClaseEstadoContrato,
    obtenerNombreEstadoContrato,
    obtenerClaseVigenciaContrato,
    obtenerTextoVigenciaContrato,
    formatearFechaContrato,
    formatearMontoContrato,
    obtenerAccionesPermitidasContrato,
} from '../../utils/contrato.utils';
import { Router } from '@angular/router';

@Component({
    selector: 'app-contratos-list',
    templateUrl: './contratos-list.html',
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatTooltipModule,
        MatPaginatorModule,
    ],
})
export default class ContratosList {

    // Agregar aquí las siguientes secciones.
    private readonly router =
        inject(Router);

    private readonly fb =
        inject(FormBuilder);

    private readonly destroyRef =
        inject(DestroyRef);

    private readonly auth =
        inject(AuthService);

    private readonly contratosService =
        inject(ContratosService);

    private readonly estadosService =
        inject(EstadosContratoService);

    private readonly tiposService =
        inject(TiposContratoService);

    private readonly clientesService =
        inject(ClientesService);

    private readonly proveedoresService =
        inject(ProveedoresService);

    protected readonly empresaContexto =
        inject(EmpresaContextoService);

    protected readonly contratos =
        signal<ContratoList[]>([]);

    protected readonly tiposContrato =
        signal<TipoContratoList[]>([]);

    protected readonly estadosContrato =
        signal<EstadoContrato[]>([]);

    protected readonly clientes =
        signal<ClienteList[]>([]);

    protected readonly proveedores =
        signal<ProveedorList[]>([]);

    protected readonly indicadores =
        signal<ContratoIndicadores | null>(null);

    protected readonly loading =
        signal(false);

    protected readonly loadingCatalogos =
        signal(false);

    protected readonly loadingIndicadores =
        signal(false);

    protected readonly errorMessage =
        signal<string | null>(null);

    protected readonly errorCatalogos =
        signal<string | null>(null);

    protected readonly errorIndicadores =
        signal<string | null>(null);

    protected readonly errorFiltros =
        signal<string | null>(null);

    protected readonly filtrosAvanzados =
        signal(false);

    protected readonly indicadorSeleccionado =
        signal<ContratoIndicadorFiltro>('total');

    protected readonly pagina =
        signal<number>(
            CONTRATOS_CONFIG.PAGINA_INICIAL
        );

    protected readonly registrosPorPagina =
        signal<number>(
            CONTRATOS_CONFIG.REGISTROS_POR_PAGINA
        );

    protected readonly totalRegistros =
        signal(0);

    protected readonly totalPaginas =
        signal(0);

    protected readonly opcionesPaginacion =
        CONTRATOS_OPCIONES_PAGINACION;

    protected readonly opcionesVencimiento =
        CONTRATOS_OPCIONES_VENCIMIENTO;

    private listadoSub?: Subscription;

    private catalogosSub?: Subscription;

    private indicadoresSub?: Subscription;

    private empresaCargada: string | null = null;

    private secuenciaListado = 0;

    private secuenciaCatalogos = 0;

    private secuenciaIndicadores = 0;

    protected readonly puedeGestionar = computed(() =>
        this.auth.hasAnyRole([
            AUTH_ROLES.ADMINISTRADOR,
            AUTH_ROLES.ADMIN_EMPRESA,
        ])
    );

    protected readonly claseEstado =
        obtenerClaseEstadoContrato;

    protected readonly nombreEstado =
        obtenerNombreEstadoContrato;

    protected readonly claseVigencia =
        obtenerClaseVigenciaContrato;

    protected readonly textoVigencia =
        obtenerTextoVigenciaContrato;

    protected readonly formatoFecha =
        formatearFechaContrato;

    protected readonly formatoMonto =
        formatearMontoContrato;

    protected readonly filtrosForm =
        this.fb.nonNullable.group({
            buscar: [''],
            tipoContratoId: [''],
            estadoContratoId: [0],
            clienteId: [''],
            proveedorId: [''],
            activo: ['activos'],
            renovacionAutomatica: ['todos'],
            moneda: [''],
            fechaInicioDesde: [''],
            fechaInicioHasta: [''],
            fechaFinDesde: [''],
            fechaFinHasta: [''],
            vencimiento: ['todos'],
            diasProximosAVencer: [
                Number(
                    CONTRATOS_CONFIG.DIAS_PROXIMOS_A_VENCER
                ),
            ],
        });

    constructor() {

        this.filtrosForm.valueChanges
            .pipe(
                debounceTime(350),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => {

                const empresaId =
                    this.empresaContexto.empresaId;

                if (
                    !empresaId ||
                    empresaId !== this.empresaCargada
                ) {
                    return;
                }

                this.pagina.set(1);

                this.indicadorSeleccionado.set('total');

                this.cargarListado();
            });

        this.filtrosForm.controls.diasProximosAVencer
            .valueChanges
            .pipe(
                debounceTime(350),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => {

                const empresaId =
                    this.empresaContexto.empresaId;

                if (
                    empresaId &&
                    empresaId === this.empresaCargada
                ) {

                    this.cargarIndicadores();
                }
            });

        effect(() => {

            const empresaId =
                this.empresaContexto.seleccionada()?.id ??
                null;

            untracked(() => {

                this.cambiarEmpresa(empresaId);
            });
        });

        this.destroyRef.onDestroy(() => {

            this.cancelarPeticiones();
        });
    }

    protected nuevo(): void {

        if (
            !this.puedeGestionar() ||
            !this.empresaContexto.empresaId
        ) {
            return;
        }

        void this.router.navigate([
            '/admin/contratos/nuevo',
        ]);
    }

    protected editarContrato(
        contrato: ContratoList
    ): void {

        const empresaId =
            this.empresaContexto.empresaId;

        if (

            !empresaId ||

            contrato.empresaId !== empresaId ||

            !this.puedeEditarContrato(contrato)

        ) {
            return;
        }

        void this.router.navigate([

            '/admin/contratos',

            contrato.id,

            'editar',

        ]);
    }

    protected abrirContrato(
        contrato: ContratoList
    ): void {

        const empresaId =
            this.empresaContexto.empresaId;

        if (

            !empresaId ||

            contrato.empresaId !== empresaId

        ) {
            return;
        }

        void this.router.navigate([

            '/admin/contratos',

            contrato.id,

        ]);
    }
    protected puedeEditarContrato(
        contrato: ContratoList
    ): boolean {

        return obtenerAccionesPermitidasContrato(
            contrato,
            this.puedeGestionar()
        ).editar;
    }

    private cambiarEmpresa(
        empresaId: string | null
    ): void {

        if (
            this.empresaCargada === empresaId
        ) {
            return;
        }

        this.cancelarPeticiones();

        this.empresaCargada = empresaId;

        this.contratos.set([]);

        this.tiposContrato.set([]);
        this.estadosContrato.set([]);
        this.clientes.set([]);
        this.proveedores.set([]);

        this.indicadores.set(null);

        this.totalRegistros.set(0);
        this.totalPaginas.set(0);

        this.pagina.set(1);

        this.registrosPorPagina.set(
            CONTRATOS_CONFIG.REGISTROS_POR_PAGINA
        );

        this.errorMessage.set(null);
        this.errorCatalogos.set(null);
        this.errorIndicadores.set(null);
        this.errorFiltros.set(null);

        this.loading.set(false);
        this.loadingCatalogos.set(false);
        this.loadingIndicadores.set(false);

        this.filtrosAvanzados.set(false);

        this.indicadorSeleccionado.set('total');

        this.reiniciarFormulario();

        if (!empresaId) {
            return;
        }

        this.cargarCatalogos();

        this.cargarIndicadores();

        this.cargarListado();
    }

    private reiniciarFormulario(): void {

        this.filtrosForm.reset({

            buscar: '',

            tipoContratoId: '',

            estadoContratoId: 0,

            clienteId: '',

            proveedorId: '',

            activo: 'activos',

            renovacionAutomatica: 'todos',

            moneda: '',

            fechaInicioDesde: '',

            fechaInicioHasta: '',

            fechaFinDesde: '',

            fechaFinHasta: '',

            vencimiento: 'todos',

            diasProximosAVencer:
                CONTRATOS_CONFIG.DIAS_PROXIMOS_A_VENCER,

        }, {
            emitEvent: false,
        });
    }

    private cancelarPeticiones(): void {

        this.secuenciaListado++;

        this.secuenciaCatalogos++;

        this.secuenciaIndicadores++;

        this.listadoSub?.unsubscribe();

        this.catalogosSub?.unsubscribe();

        this.indicadoresSub?.unsubscribe();

        this.listadoSub = undefined;

        this.catalogosSub = undefined;

        this.indicadoresSub = undefined;
    }

    private cargarCatalogos(): void {

        const empresaId =
            this.empresaContexto.empresaId;

        if (
            !empresaId ||
            empresaId !== this.empresaCargada
        ) {
            return;
        }

        this.catalogosSub?.unsubscribe();

        const secuencia =
            ++this.secuenciaCatalogos;

        this.loadingCatalogos.set(true);

        this.errorCatalogos.set(null);

        this.catalogosSub = forkJoin({

            tipos:
                this.tiposService.getAll(),

            estados:
                this.estadosService.getAll(),

            clientes:
                this.clientesService.getAll(),

            proveedores:
                this.proveedoresService.getAll(),

        }).subscribe({

            next: datos => {

                if (
                    this.empresaContexto.empresaId !== empresaId ||
                    secuencia !== this.secuenciaCatalogos
                ) {
                    return;
                }

                this.tiposContrato.set(
                    datos.tipos
                );

                this.estadosContrato.set(
                    [...datos.estados].sort(
                        (a, b) => a.orden - b.orden
                    )
                );

                this.clientes.set(
                    datos.clientes
                );

                this.proveedores.set(
                    datos.proveedores
                );

                this.loadingCatalogos.set(false);
            },

            error: (error: unknown) => {

                if (
                    this.empresaContexto.empresaId !== empresaId ||
                    secuencia !== this.secuenciaCatalogos
                ) {
                    return;
                }

                this.errorCatalogos.set(
                    this.mensajeError(
                        error,
                        'No fue posible cargar los catálogos de filtros.'
                    )
                );

                this.loadingCatalogos.set(false);
            },

        });
    }

    private cargarIndicadores(): void {

        const empresaId =
            this.empresaContexto.empresaId;

        if (
            !empresaId ||
            empresaId !== this.empresaCargada
        ) {
            return;
        }

        this.indicadoresSub?.unsubscribe();

        const secuencia =
            ++this.secuenciaIndicadores;

        this.loadingIndicadores.set(true);

        this.errorIndicadores.set(null);

        this.indicadores.set(null);

        const dias =
            this.obtenerDiasVencimiento();

        const base: ContratoFiltros = {

            activo: true,

            pagina: 1,

            registrosPorPagina: 1,

            diasProximosAVencer: dias,

        };

        this.indicadoresSub = forkJoin({

            total:
                this.contratosService.getAll({
                    ...base,
                }),

            vigentes:
                this.contratosService.getAll({
                    ...base,

                    estadoContratoId:
                        ESTADOS_CONTRATO.VIGENTE,

                    vencidos: false,
                }),

            proximosAVencer:
                this.contratosService.getAll({
                    ...base,

                    proximosAVencer: true,
                }),

            vencidos:
                this.contratosService.getAll({
                    ...base,

                    vencidos: true,
                }),

            borradores:
                this.contratosService.getAll({
                    ...base,

                    estadoContratoId:
                        ESTADOS_CONTRATO.BORRADOR,
                }),

            renovacionAutomatica:
                this.contratosService.getAll({
                    ...base,

                    renovacionAutomatica: true,
                }),

        }).subscribe({

            next: datos => {

                if (
                    this.empresaContexto.empresaId !== empresaId ||
                    secuencia !== this.secuenciaIndicadores
                ) {
                    return;
                }

                this.indicadores.set({

                    total:
                        datos.total.totalRegistros,

                    vigentes:
                        datos.vigentes.totalRegistros,

                    proximosAVencer:
                        datos.proximosAVencer.totalRegistros,

                    vencidos:
                        datos.vencidos.totalRegistros,

                    borradores:
                        datos.borradores.totalRegistros,

                    renovacionAutomatica:
                        datos.renovacionAutomatica.totalRegistros,

                });

                this.loadingIndicadores.set(false);
            },

            error: (error: unknown) => {

                if (
                    this.empresaContexto.empresaId !== empresaId ||
                    secuencia !== this.secuenciaIndicadores
                ) {
                    return;
                }

                this.errorIndicadores.set(
                    this.mensajeError(
                        error,
                        'No fue posible cargar los indicadores.'
                    )
                );

                this.loadingIndicadores.set(false);
            },

        });
    }

    private obtenerDiasVencimiento(): number {

        const valor = Number(
            this.filtrosForm.controls
                .diasProximosAVencer.value
        );

        if (!Number.isFinite(valor)) {

            return CONTRATOS_CONFIG
                .DIAS_PROXIMOS_A_VENCER;
        }

        return Math.min(

            CONTRATOS_CONFIG
                .MAX_DIAS_PROXIMOS_A_VENCER,

            Math.max(

                CONTRATOS_CONFIG
                    .MIN_DIAS_PROXIMOS_A_VENCER,

                Math.trunc(valor)
            )
        );
    }

    private construirFiltros(): ContratoFiltros {

        const f =
            this.filtrosForm.getRawValue();

        const filtros: ContratoFiltros = {

            buscar:
                f.buscar.trim() || undefined,

            tipoContratoId:
                f.tipoContratoId || undefined,

            estadoContratoId:
                f.estadoContratoId || undefined,

            clienteId:
                f.clienteId || undefined,

            proveedorId:
                f.proveedorId || undefined,

            activo:
                f.activo !== 'eliminados',

            moneda:
                f.moneda.trim().toUpperCase() ||
                undefined,

            fechaInicioDesde:
                f.fechaInicioDesde || undefined,

            fechaInicioHasta:
                f.fechaInicioHasta || undefined,

            fechaFinDesde:
                f.fechaFinDesde || undefined,

            fechaFinHasta:
                f.fechaFinHasta || undefined,

            diasProximosAVencer:
                this.obtenerDiasVencimiento(),

            pagina:
                this.pagina(),

            registrosPorPagina:
                this.registrosPorPagina(),

        };

        switch (f.renovacionAutomatica) {

            case 'si':

                filtros.renovacionAutomatica = true;

                break;

            case 'no':

                filtros.renovacionAutomatica = false;

                break;
        }

        switch (f.vencimiento) {

            case 'vencidos':

                filtros.vencidos = true;

                break;

            case 'no-vencidos':

                filtros.vencidos = false;

                break;

            case 'proximos':

                filtros.proximosAVencer = true;

                break;

            case 'indefinidos':

                filtros.sinFechaFin = true;

                break;

            case 'con-fecha':

                filtros.sinFechaFin = false;

                break;
        }

        // El API filtra EstadoContratoId utilizando
        // el estado almacenado.
        //
        // Para VENCIDO utilizamos la condición
        // de vencimiento por fecha.

        if (
            filtros.estadoContratoId ===
            ESTADOS_CONTRATO.VENCIDO
        ) {

            delete filtros.estadoContratoId;

            filtros.vencidos = true;

        } else if (

            filtros.estadoContratoId ===
            ESTADOS_CONTRATO.VIGENTE ||

            filtros.estadoContratoId ===
            ESTADOS_CONTRATO.SUSPENDIDO

        ) {

            // Evitar mostrar como vigentes o suspendidos
            // contratos que ya vencieron por fecha.

            if (filtros.vencidos === undefined) {

                filtros.vencidos = false;
            }
        }

        return filtros;
    }

    private validarFiltros(): string | null {

        const f =
            this.filtrosForm.getRawValue();

        if (

            f.fechaInicioDesde &&

            f.fechaInicioHasta &&

            f.fechaInicioDesde > f.fechaInicioHasta

        ) {

            return 'El rango de fechas de inicio no es válido.';
        }

        if (

            f.fechaFinDesde &&

            f.fechaFinHasta &&

            f.fechaFinDesde > f.fechaFinHasta

        ) {

            return 'El rango de fechas de fin no es válido.';
        }

        if (

            f.moneda.trim() &&

            !/^[A-Za-z]{3}$/.test(
                f.moneda.trim()
            )

        ) {

            return 'La moneda debe contener tres letras.';
        }

        if (

            f.vencimiento === 'indefinidos' &&

            (
                f.fechaFinDesde ||
                f.fechaFinHasta
            )

        ) {

            return 'No puedes combinar vigencia indefinida con un rango de fechas de fin.';
        }

        if (

            f.estadoContratoId ===
            ESTADOS_CONTRATO.VENCIDO &&

            [
                'no-vencidos',
                'proximos',
                'indefinidos',
            ].includes(f.vencimiento)

        ) {

            return 'El filtro de vencimiento no es compatible con el estado Vencido.';
        }

        if (

            f.vencimiento === 'vencidos' &&

            f.estadoContratoId !== 0 &&

            f.estadoContratoId !==
            ESTADOS_CONTRATO.VENCIDO

        ) {

            return 'Para consultar vencidos selecciona Todos los estados o Vencido.';
        }

        if (

            f.vencimiento === 'proximos' &&

            f.estadoContratoId !== 0 &&

            f.estadoContratoId !==
            ESTADOS_CONTRATO.VIGENTE &&

            f.estadoContratoId !==
            ESTADOS_CONTRATO.SUSPENDIDO

        ) {

            return 'Los próximos vencimientos aplican a contratos vigentes o suspendidos.';
        }

        return null;
    }

    private cargarListado(): void {

        const empresaId =
            this.empresaContexto.empresaId;

        if (
            !empresaId ||
            empresaId !== this.empresaCargada
        ) {
            return;
        }

        this.listadoSub?.unsubscribe();

        const secuencia =
            ++this.secuenciaListado;

        this.errorMessage.set(null);

        this.errorFiltros.set(null);

        const error =
            this.validarFiltros();

        if (error) {

            this.errorFiltros.set(error);

            this.contratos.set([]);

            this.totalRegistros.set(0);

            this.totalPaginas.set(0);

            this.loading.set(false);

            return;
        }

        this.loading.set(true);

        const filtros =
            this.construirFiltros();

        this.listadoSub = this.contratosService
            .getAll(filtros)
            .subscribe({

                next: resultado => {

                    if (
                        this.empresaContexto.empresaId !== empresaId ||
                        secuencia !== this.secuenciaListado
                    ) {
                        return;
                    }

                    this.totalRegistros.set(
                        resultado.totalRegistros
                    );

                    this.totalPaginas.set(
                        resultado.totalPaginas
                    );

                    this.registrosPorPagina.set(
                        resultado.registrosPorPagina
                    );

                    // Si la página actual dejó de existir,
                    // regresar a la última disponible.

                    if (

                        resultado.totalPaginas > 0 &&

                        resultado.pagina >
                        resultado.totalPaginas

                    ) {

                        this.pagina.set(
                            resultado.totalPaginas
                        );

                        this.cargarListado();

                        return;
                    }

                    this.pagina.set(

                        resultado.totalPaginas === 0
                            ? 1
                            : resultado.pagina
                    );

                    this.contratos.set(
                        resultado.items
                    );

                    this.loading.set(false);
                },

                error: (error: unknown) => {

                    if (
                        this.empresaContexto.empresaId !== empresaId ||
                        secuencia !== this.secuenciaListado
                    ) {
                        return;
                    }

                    this.contratos.set([]);

                    this.totalRegistros.set(0);

                    this.totalPaginas.set(0);

                    this.errorMessage.set(
                        this.mensajeError(
                            error,
                            'No fue posible cargar los contratos.'
                        )
                    );

                    this.loading.set(false);
                },

            });
    }

    protected cambiarPagina(
        evento: PageEvent
    ): void {

        if (
            !this.empresaContexto.empresaId
        ) {
            return;
        }

        const cambioTamano =
            evento.pageSize !==
            this.registrosPorPagina();

        this.registrosPorPagina.set(
            evento.pageSize
        );

        this.pagina.set(

            cambioTamano
                ? 1
                : evento.pageIndex + 1
        );

        this.cargarListado();
    }

    protected seleccionarIndicador(
        indicador: ContratoIndicadorFiltro
    ): void {

        if (
            !this.empresaContexto.empresaId
        ) {
            return;
        }

        const dias =
            this.obtenerDiasVencimiento();

        this.reiniciarFormulario();

        this.filtrosForm.controls
            .diasProximosAVencer
            .setValue(dias, {
                emitEvent: false,
            });

        switch (indicador) {

            case 'vigentes':

                this.filtrosForm.patchValue({

                    estadoContratoId:
                        ESTADOS_CONTRATO.VIGENTE,

                    vencimiento:
                        'no-vencidos',

                }, {
                    emitEvent: false,
                });

                break;

            case 'proximosAVencer':

                this.filtrosForm.patchValue({

                    vencimiento:
                        'proximos',

                }, {
                    emitEvent: false,
                });

                break;

            case 'vencidos':

                this.filtrosForm.patchValue({

                    vencimiento:
                        'vencidos',

                }, {
                    emitEvent: false,
                });

                break;

            case 'borradores':

                this.filtrosForm.patchValue({

                    estadoContratoId:
                        ESTADOS_CONTRATO.BORRADOR,

                }, {
                    emitEvent: false,
                });

                break;

            case 'renovacionAutomatica':

                this.filtrosForm.patchValue({

                    renovacionAutomatica:
                        'si',

                }, {
                    emitEvent: false,
                });

                break;
        }

        this.indicadorSeleccionado.set(
            indicador
        );

        this.pagina.set(1);

        this.cargarListado();

    }

    protected limpiarFiltros(): void {

        const diasAnteriores =
            this.obtenerDiasVencimiento();

        this.reiniciarFormulario();

        this.indicadorSeleccionado.set('total');

        this.errorFiltros.set(null);

        this.pagina.set(1);

        this.cargarListado();

        if (
            diasAnteriores !==
            CONTRATOS_CONFIG.DIAS_PROXIMOS_A_VENCER
        ) {

            this.cargarIndicadores();
        }
    }

    protected alternarFiltrosAvanzados(): void {

        this.filtrosAvanzados.update(
            valor => !valor
        );
    }

    protected actualizar(): void {

        if (
            !this.empresaContexto.empresaId
        ) {
            return;
        }

        this.cargarCatalogos();

        this.cargarIndicadores();

        this.cargarListado();
    }

    protected mostrarIndicador(
        clave: keyof ContratoIndicadores
    ): number | string {

        if (this.loadingIndicadores()) {

            return '...';
        }

        return this.indicadores()?.[clave] ??
            '—';
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