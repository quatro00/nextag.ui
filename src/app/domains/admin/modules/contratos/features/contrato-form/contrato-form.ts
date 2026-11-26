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
    AbstractControl,
    FormBuilder,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';

import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import {
    firstValueFrom,
    forkJoin,
    Observable,
    of,
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

import {
    ContratoDetalle,
    ContratoGuardar,
} from '../../types/contrato.types';

import {
    CONTRATOS_CONFIG,
    CONTRATOS_MONEDAS_SUGERIDAS,
} from '../../constants/contratos.constants';

import {
    PERIODICIDADES_PAGO,
} from '../../constants/periodicidades-pago.constants';

import {
    obtenerAccionesPermitidasContratoDetalle,
    obtenerClaseEstadoContrato,
    obtenerNombreEstadoContrato,
    obtenerFechaFormulario,
} from '../../utils/contrato.utils';

@Component({
    selector: 'app-contrato-form',
    templateUrl: './contrato-form.html',
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatCheckboxModule,
    ],
})
export default class ContratoForm {

    // Agregar aquí las siguientes secciones.
    private readonly fb = inject(FormBuilder);

private readonly route = inject(ActivatedRoute);

private readonly router = inject(Router);

private readonly auth = inject(AuthService);

private readonly destroyRef = inject(DestroyRef);

private readonly contratosService =
    inject(ContratosService);

private readonly tiposService =
    inject(TiposContratoService);

private readonly clientesService =
    inject(ClientesService);

private readonly proveedoresService =
    inject(ProveedoresService);

protected readonly empresaContexto =
    inject(EmpresaContextoService);

    protected readonly id =
    this.route.snapshot.paramMap.get('id');

protected readonly esEdicion =
    !!this.id;

protected readonly contrato =
    signal<ContratoDetalle | null>(null);

protected readonly tiposContrato =
    signal<TipoContratoList[]>([]);

protected readonly clientes =
    signal<ClienteList[]>([]);

protected readonly proveedores =
    signal<ProveedorList[]>([]);

protected readonly loading =
    signal(false);

protected readonly guardando =
    signal(false);

protected readonly detalleCargado =
    signal(false);

protected readonly errorMessage =
    signal<string | null>(null);

protected readonly successMessage =
    signal<string | null>(null);

private readonly empresaFormulario =
    signal<string | null>(null);

private secuenciaCarga = 0;

private destruido = false;

protected readonly periodicidades =
    PERIODICIDADES_PAGO;

protected readonly monedasSugeridas =
    CONTRATOS_MONEDAS_SUGERIDAS;

protected readonly config =
    CONTRATOS_CONFIG;

protected readonly claseEstado =
    obtenerClaseEstadoContrato;

protected readonly nombreEstado =
    obtenerNombreEstadoContrato;

    protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([
        AUTH_ROLES.ADMINISTRADOR,
        AUTH_ROLES.ADMIN_EMPRESA,
    ])
);

protected readonly acciones = computed(() => {

    const contrato = this.contrato();

    if (!contrato) {
        return null;
    }

    return obtenerAccionesPermitidasContratoDetalle(
        contrato,
        this.puedeGestionar()
    );
});

protected readonly puedeEditar = computed(() => {

    if (!this.puedeGestionar()) {
        return false;
    }

    if (!this.esEdicion) {
        return true;
    }

    return this.acciones()?.editar === true;
});

protected readonly puedeEditarVigencia = computed(() => {

    if (!this.puedeEditar()) {
        return false;
    }

    if (!this.esEdicion) {
        return true;
    }

    return this.acciones()?.editarVigencia === true;
});

protected readonly titulo = computed(() => {

    if (!this.esEdicion) {
        return 'Nuevo contrato';
    }

    return this.puedeEditar()
        ? 'Editar contrato'
        : 'Consultar contrato';
});

protected readonly form =
    this.fb.group({

        // Información general

        numeroContrato:
            this.fb.nonNullable.control('', [
                Validators.required,
                Validators.maxLength(50),
            ]),

        nombre:
            this.fb.nonNullable.control('', [
                Validators.required,
                Validators.maxLength(200),
            ]),

        descripcion:
            this.fb.nonNullable.control(''),

        tipoContratoId:
            this.fb.nonNullable.control('', [
                Validators.required,
            ]),

        // Relaciones comerciales

        clienteId:
            this.fb.nonNullable.control(''),

        proveedorId:
            this.fb.nonNullable.control(''),

        // Vigencia

        fechaInicio:
            this.fb.nonNullable.control('', [
                Validators.required,
            ]),

        fechaFin:
            this.fb.nonNullable.control(''),

        fechaFirma:
            this.fb.nonNullable.control(''),

        // Renovación

        renovacionAutomatica:
            this.fb.nonNullable.control(false),

        diasAvisoNoRenovacion:
            this.fb.control<number | null>(
                null,
                [
                    Validators.min(0),
                    Validators.max(
                        CONTRATOS_CONFIG.MAX_ENTERO
                    ),
                    this.validarEntero,
                ]
            ),

        // Condiciones económicas

        monto:
            this.fb.control<number | null>(
                null,
                [
                    Validators.min(0),
                    this.validarDecimal,
                ]
            ),

        moneda:
            this.fb.nonNullable.control(
                CONTRATOS_CONFIG.MONEDA_PREDETERMINADA as string,
                [
                    Validators.required,
                    Validators.pattern(/^[A-Za-z]{3}$/),
                ]
            ),

        periodicidadPago:
            this.fb.nonNullable.control(''),

        diaPago:
            this.fb.control<number | null>(
                null,
                [
                    Validators.min(1),
                    Validators.max(31),
                    this.validarEntero,
                ]
            ),

        incluyeImpuestos:
            this.fb.nonNullable.control(false),

        // Cobertura

        incluyePreventivo:
            this.fb.control<boolean | null>(null),

        incluyeCorrectivo:
            this.fb.control<boolean | null>(null),

        incluyeRefacciones:
            this.fb.control<boolean | null>(null),

        incluyeManoObra:
            this.fb.control<boolean | null>(null),

        // SLA

        tiempoRespuestaHoras:
            this.fb.control<number | null>(
                null,
                [
                    Validators.min(0),
                    Validators.max(
                        CONTRATOS_CONFIG.MAX_TIEMPO_RESPUESTA_HORAS
                    ),
                    this.validarDecimal,
                ]
            ),

        horarioAtencion:
            this.fb.nonNullable.control('', [
                Validators.maxLength(200),
            ]),

        serviciosIncluidos:
            this.fb.control<number | null>(
                null,
                [
                    Validators.min(0),
                    Validators.max(
                        CONTRATOS_CONFIG.MAX_ENTERO
                    ),
                    this.validarEntero,
                ]
            ),

        // Condiciones adicionales

        condicionesServicio:
            this.fb.nonNullable.control(''),

        observaciones:
            this.fb.nonNullable.control(''),

    });

    private validarEntero(
    control: AbstractControl
): ValidationErrors | null {

    const valor = control.value;

    if (
        valor === null ||
        valor === undefined ||
        valor === ''
    ) {
        return null;
    }

    return Number.isInteger(valor)
        ? null
        : { entero: true };
}

private validarDecimal(
    control: AbstractControl
): ValidationErrors | null {

    const valor = control.value;

    if (
        valor === null ||
        valor === undefined ||
        valor === ''
    ) {
        return null;
    }

    if (
        typeof valor !== 'number' ||
        !Number.isFinite(valor)
    ) {
        return { decimal: true };
    }

    // JavaScript representa los números
    // mediante punto flotante.
    // Limitamos los valores a un rango que
    // permita manejar centavos de forma razonable.

    if (
        Math.abs(valor) >
        Number.MAX_SAFE_INTEGER / 100
    ) {
        return { precisionDecimal: true };
    }

    const centavos = valor * 100;

    const diferencia = Math.abs(
        centavos - Math.round(centavos)
    );

    const tolerancia = Math.min(
        0.001,
        Math.max(
            0.00000001,
            Math.abs(centavos) *
                Number.EPSILON * 4
        )
    );

    return diferencia <= tolerancia
        ? null
        : { decimal: true };
}

protected readonly tiposDisponibles = computed(() => {

    const actual =
        this.contrato()?.tipoContratoId;

    return this.tiposContrato().filter(x =>
        x.activo ||
        x.id === actual
    );
});

protected readonly clientesDisponibles = computed(() => {

    const actual =
        this.contrato()?.clienteId;

    return this.clientes().filter(x =>
        x.activo ||
        x.id === actual
    );
});

protected readonly proveedoresDisponibles = computed(() => {

    const actual =
        this.contrato()?.proveedorId;

    return this.proveedores().filter(x =>
        x.activo ||
        x.id === actual
    );
});

protected readonly relacionesInactivas = computed(() => {

    const contrato = this.contrato();

    if (!contrato) {
        return [];
    }

    const advertencias: string[] = [];

    const tipo = this.tiposContrato().find(
        x => x.id === contrato.tipoContratoId
    );

    if (tipo && !tipo.activo) {

        advertencias.push(
            `El tipo de contrato "${tipo.nombre}" está inactivo.`
        );
    }

    const cliente = this.clientes().find(
        x => x.id === contrato.clienteId
    );

    if (cliente && !cliente.activo) {

        advertencias.push(
            `El cliente "${cliente.nombre}" está inactivo.`
        );
    }

    const proveedor = this.proveedores().find(
        x => x.id === contrato.proveedorId
    );

    if (proveedor && !proveedor.activo) {

        advertencias.push(
            `El proveedor "${proveedor.nombre}" está inactivo.`
        );
    }

    return advertencias;
});

constructor() {

    effect(onCleanup => {

        const empresaId =
            this.empresaContexto.seleccionada()?.id ??
            null;

        const puedeGestionar =
            this.puedeGestionar();

        const sub = untracked(() => {

            const secuencia =
                ++this.secuenciaCarga;

            this.reiniciarFormulario();

            this.empresaFormulario.set(null);

            this.contrato.set(null);

            this.tiposContrato.set([]);
            this.clientes.set([]);
            this.proveedores.set([]);

            this.errorMessage.set(null);
            this.successMessage.set(null);

            this.detalleCargado.set(false);

            this.loading.set(!!empresaId);

            if (!empresaId) {
                return undefined;
            }

            const detalle$: Observable<ContratoDetalle | null> =
                this.id
                    ? this.contratosService.getById(this.id)
                    : of(null);

            return forkJoin({

                tipos:
                    this.tiposService.getAll(),

                clientes:
                    this.clientesService.getAll(),

                proveedores:
                    this.proveedoresService.getAll(),

                detalle:
                    detalle$,

            }).subscribe({

                next: datos => {

                    if (
                        this.destruido ||
                        this.empresaContexto.empresaId !== empresaId ||
                        secuencia !== this.secuenciaCarga
                    ) {
                        return;
                    }

                    if (
                        datos.detalle &&
                        datos.detalle.empresaId !== empresaId
                    ) {

                        this.errorMessage.set(
                            'El contrato no pertenece a la empresa seleccionada.'
                        );

                        this.loading.set(false);

                        return;
                    }

                    this.tiposContrato.set(
                        datos.tipos
                    );

                    this.clientes.set(
                        datos.clientes
                    );

                    this.proveedores.set(
                        datos.proveedores
                    );

                    if (datos.detalle) {

                        this.contrato.set(
                            datos.detalle
                        );

                        this.cargarFormulario(
                            datos.detalle
                        );
                    }

                    this.empresaFormulario.set(
                        empresaId
                    );

                    this.detalleCargado.set(true);

                    this.loading.set(false);

                    this.aplicarPermisosFormulario(
                        puedeGestionar
                    );

                    this.form.markAsPristine();

                    this.form.markAsUntouched();
                },

                error: (error: unknown) => {

                    if (
                        this.destruido ||
                        this.empresaContexto.empresaId !== empresaId ||
                        secuencia !== this.secuenciaCarga
                    ) {
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
        });

        onCleanup(() => {

            sub?.unsubscribe();
        });
    });

    this.destroyRef.onDestroy(() => {

        this.destruido = true;

        this.secuenciaCarga++;
    });
}

private reiniciarFormulario(): void {

    this.form.reset({

        numeroContrato: '',
        nombre: '',
        descripcion: '',
        tipoContratoId: '',

        clienteId: '',
        proveedorId: '',

        fechaInicio: '',
        fechaFin: '',
        fechaFirma: '',

        renovacionAutomatica: false,
        diasAvisoNoRenovacion: null,

        monto: null,
        moneda: CONTRATOS_CONFIG.MONEDA_PREDETERMINADA,
        periodicidadPago: '',
        diaPago: null,
        incluyeImpuestos: false,

        incluyePreventivo: null,
        incluyeCorrectivo: null,
        incluyeRefacciones: null,
        incluyeManoObra: null,

        tiempoRespuestaHoras: null,
        horarioAtencion: '',
        serviciosIncluidos: null,

        condicionesServicio: '',
        observaciones: '',

    }, {
        emitEvent: false,
    });

    this.form.disable({
        emitEvent: false,
    });
}

private cargarFormulario(
    contrato: ContratoDetalle
): void {

    this.form.patchValue({

        numeroContrato:
            contrato.numeroContrato,

        nombre:
            contrato.nombre,

        descripcion:
            contrato.descripcion ?? '',

        tipoContratoId:
            contrato.tipoContratoId,

        clienteId:
            contrato.clienteId ?? '',

        proveedorId:
            contrato.proveedorId ?? '',

        fechaInicio:
            obtenerFechaFormulario(
                contrato.fechaInicio
            ),

        fechaFin:
            obtenerFechaFormulario(
                contrato.fechaFin
            ),

        fechaFirma:
            obtenerFechaFormulario(
                contrato.fechaFirma
            ),

        renovacionAutomatica:
            contrato.renovacionAutomatica,

        diasAvisoNoRenovacion:
            contrato.diasAvisoNoRenovacion,

        monto:
            contrato.monto,

        moneda:
            contrato.moneda,

        periodicidadPago:
            contrato.periodicidadPago ?? '',

        diaPago:
            contrato.diaPago,

        incluyeImpuestos:
            contrato.incluyeImpuestos,

        incluyePreventivo:
            contrato.incluyePreventivo,

        incluyeCorrectivo:
            contrato.incluyeCorrectivo,

        incluyeRefacciones:
            contrato.incluyeRefacciones,

        incluyeManoObra:
            contrato.incluyeManoObra,

        tiempoRespuestaHoras:
            contrato.tiempoRespuestaHoras,

        horarioAtencion:
            contrato.horarioAtencion ?? '',

        serviciosIncluidos:
            contrato.serviciosIncluidos,

        condicionesServicio:
            contrato.condicionesServicio ?? '',

        observaciones:
            contrato.observaciones ?? '',

    }, {
        emitEvent: false,
    });
}

private aplicarPermisosFormulario(
    puedeGestionar = this.puedeGestionar()
): void {

    this.form.disable({
        emitEvent: false,
    });

    if (
        !puedeGestionar ||
        !this.detalleCargado() ||
        !this.puedeEditar() ||
        this.guardando()
    ) {
        return;
    }

    this.form.enable({
        emitEvent: false,
    });

    if (!this.puedeEditarVigencia()) {

        this.form.controls.fechaInicio.disable({
            emitEvent: false,
        });

        this.form.controls.fechaFin.disable({
            emitEvent: false,
        });
    }
}

private validarRelaciones(
    dto: ContratoGuardar
): string | null {

    const contrato =
        this.contrato();

    const tipo = this.tiposContrato().find(
        x => x.id === dto.tipoContratoId
    );

    if (!tipo) {

        return 'Selecciona un tipo de contrato válido.';
    }

    if (
        !tipo.activo &&
        contrato?.tipoContratoId !== tipo.id
    ) {

        return 'El tipo de contrato seleccionado está inactivo.';
    }

    if (dto.clienteId) {

        const cliente = this.clientes().find(
            x => x.id === dto.clienteId
        );

        if (!cliente) {

            return 'El cliente seleccionado no es válido.';
        }

        if (
            !cliente.activo &&
            contrato?.clienteId !== cliente.id
        ) {

            return 'El cliente seleccionado está inactivo.';
        }
    }

    if (dto.proveedorId) {

        const proveedor = this.proveedores().find(
            x => x.id === dto.proveedorId
        );

        if (!proveedor) {

            return 'El proveedor seleccionado no es válido.';
        }

        if (
            !proveedor.activo &&
            contrato?.proveedorId !== proveedor.id
        ) {

            return 'El proveedor seleccionado está inactivo.';
        }
    }

    return null;
}

private validarDatos(
    dto: ContratoGuardar
): string | null {

    if (!dto.numeroContrato) {

        return 'El número de contrato es obligatorio.';
    }

    if (!dto.nombre) {

        return 'El nombre del contrato es obligatorio.';
    }

    if (!dto.tipoContratoId) {

        return 'Selecciona un tipo de contrato.';
    }

    if (
        !dto.fechaInicio ||
        dto.fechaInicio === '0001-01-01'
    ) {

        return 'La fecha de inicio es obligatoria.';
    }

    if (
        dto.fechaFin &&
        dto.fechaFin < dto.fechaInicio
    ) {

        return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
    }

    if (
        dto.renovacionAutomatica &&
        !dto.fechaFin
    ) {

        return 'Un contrato con renovación automática debe tener fecha de fin.';
    }

    if (
        dto.diasAvisoNoRenovacion !== null &&
        !dto.fechaFin
    ) {

        return 'Se requiere una fecha de fin para configurar el aviso de no renovación.';
    }

    if (
        !/^[A-Z]{3}$/.test(dto.moneda)
    ) {

        return 'La moneda debe contener tres letras.';
    }

    if (
        dto.periodicidadPago &&
        !PERIODICIDADES_PAGO.some(
            x => x.value === dto.periodicidadPago
        )
    ) {

        return 'La periodicidad de pago no es válida.';
    }

    const contrato =
        this.contrato();

    if (
        contrato &&
        !this.puedeEditarVigencia()
    ) {

        const fechaInicioOriginal =
            obtenerFechaFormulario(
                contrato.fechaInicio
            );

        const fechaFinOriginal =
            obtenerFechaFormulario(
                contrato.fechaFin
            ) || null;

        if (
            dto.fechaInicio !== fechaInicioOriginal ||
            dto.fechaFin !== fechaFinOriginal
        ) {

            return 'La vigencia de un contrato formalizado solamente puede modificarse mediante una renovación.';
        }
    }

    return this.validarRelaciones(dto);
}

private construirDto(): ContratoGuardar {

    const f =
        this.form.getRawValue();

    const dto: ContratoGuardar = {

        numeroContrato:
            f.numeroContrato.trim().toUpperCase(),

        nombre:
            f.nombre.trim(),

        descripcion:
            this.nullIfEmpty(f.descripcion),

        tipoContratoId:
            f.tipoContratoId,

        clienteId:
            f.clienteId || null,

        proveedorId:
            f.proveedorId || null,

        fechaInicio:
            f.fechaInicio,

        fechaFin:
            f.fechaFin || null,

        fechaFirma:
            f.fechaFirma || null,

        renovacionAutomatica:
            f.renovacionAutomatica,

        diasAvisoNoRenovacion:
            f.diasAvisoNoRenovacion,

        monto:
            f.monto,

        moneda:
            f.moneda.trim().toUpperCase(),

        periodicidadPago:
            this.nullIfEmpty(
                f.periodicidadPago
            )?.toUpperCase() ?? null,

        diaPago:
            f.diaPago,

        incluyeImpuestos:
            f.incluyeImpuestos,

        incluyePreventivo:
            f.incluyePreventivo,

        incluyeCorrectivo:
            f.incluyeCorrectivo,

        incluyeRefacciones:
            f.incluyeRefacciones,

        incluyeManoObra:
            f.incluyeManoObra,

        tiempoRespuestaHoras:
            f.tiempoRespuestaHoras,

        horarioAtencion:
            this.nullIfEmpty(
                f.horarioAtencion
            ),

        serviciosIncluidos:
            f.serviciosIncluidos,

        condicionesServicio:
            this.nullIfEmpty(
                f.condicionesServicio
            ),

        observaciones:
            this.nullIfEmpty(
                f.observaciones
            ),

    };

    return dto;
}

private nullIfEmpty(
    valor: string
): string | null {

    return valor.trim() || null;
}

protected async guardar(): Promise<void> {

    if (
        this.guardando() ||
        !this.detalleCargado() ||
        !this.puedeEditar() ||
        this.destruido
    ) {
        return;
    }

    this.errorMessage.set(null);

    this.successMessage.set(null);

    const empresaId =
        this.empresaContexto.empresaId;

    const secuencia =
        this.secuenciaCarga;

    if (
        !empresaId ||
        this.empresaFormulario() !== empresaId
    ) {

        this.errorMessage.set(
            'La empresa seleccionada cambió. Vuelve a cargar el formulario.'
        );

        return;
    }

    if (this.form.invalid) {

        this.form.markAllAsTouched();

        this.errorMessage.set(
            'Revisa los campos obligatorios y los valores del formulario.'
        );

        return;
    }

    const dto =
        this.construirDto();

    const error =
        this.validarDatos(dto);

    if (error) {

        this.errorMessage.set(error);

        return;
    }

    this.guardando.set(true);

    this.form.disable({
        emitEvent: false,
    });

    try {

        const resultado =
            await firstValueFrom(

                this.id

                    ? this.contratosService.update(
                        this.id,
                        dto
                    )

                    : this.contratosService.create(
                        dto
                    )
            );

        if (
            this.destruido ||
            this.empresaContexto.empresaId !== empresaId ||
            this.secuenciaCarga !== secuencia
        ) {
            return;
        }

        this.contrato.set(resultado);

        this.cargarFormulario(resultado);

        this.form.markAsPristine();

        if (this.id) {

            this.successMessage.set(
                'Contrato actualizado correctamente.'
            );

        } else {

            const navego = await this.router.navigate([
                '/admin/contratos',
                resultado.id,
                'editar',
            ], {
                state: {
                    contratoCreado: true,
                },
            });

            if (
                !navego &&
                !this.destruido &&
                this.empresaContexto.empresaId === empresaId
            ) {

                // El contrato ya fue creado.
                // No permitir que se registre nuevamente.

                this.detalleCargado.set(false);

                this.successMessage.set(
                    'El contrato fue registrado correctamente. Regresa al listado para consultarlo.'
                );
            }
        }

    } catch (error) {

        if (
            !this.destruido &&
            this.empresaContexto.empresaId === empresaId &&
            this.secuenciaCarga === secuencia
        ) {

            this.errorMessage.set(
                this.mensajeError(
                    error,
                    'No fue posible guardar el contrato.'
                )
            );
        }

    } finally {

        if (!this.destruido) {

            this.guardando.set(false);

            if (
                !this.esEdicion &&
                this.contrato()
            ) {

                this.form.disable({
                    emitEvent: false,
                });

            } else if (
                this.empresaFormulario() ===
                this.empresaContexto.empresaId
            ) {

                this.aplicarPermisosFormulario();
            }
        }
    }
}

protected volver(): void {

    if (this.guardando()) {
        return;
    }

    if (
        this.form.dirty &&
        this.puedeEditar()
    ) {

        const confirmar = confirm(
            'Existen cambios sin guardar. ¿Deseas regresar al listado?'
        );

        if (!confirmar) {
            return;
        }
    }

    void this.router.navigate([
        '/admin/contratos',
    ]);
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