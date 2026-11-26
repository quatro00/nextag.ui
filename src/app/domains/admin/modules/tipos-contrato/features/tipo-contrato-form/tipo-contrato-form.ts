import { HttpErrorResponse } from '@angular/common/http';
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
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import {
  firstValueFrom,
  Observable,
  of,
} from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { TiposContratoService } from '../../services/tipos-contrato.service';
import {
  TipoContratoDetalle,
  TipoContratoGuardar,
} from '../../types/tipo-contrato.types';

@Component({
  selector: 'app-tipo-contrato-form',
  templateUrl: './tipo-contrato-form.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export default class TipoContratoForm {

  private readonly fb =
    inject(FormBuilder);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly service =
    inject(TiposContratoService);

  private readonly auth =
    inject(AuthService);

  protected readonly empresaContexto =
    inject(EmpresaContextoService);

  protected readonly id =
    this.route.snapshot.paramMap.get('id');

  protected readonly esEdicion =
    !!this.id;

  protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
    ])
  );

  protected readonly titulo = computed(() => {

    if (!this.esEdicion) {
      return 'Nuevo tipo de contrato';
    }

    return this.puedeGestionar()
      ? 'Editar tipo de contrato'
      : 'Consultar tipo de contrato';
  });

  protected readonly loading =
    signal(false);

  protected readonly guardando =
    signal(false);

  protected readonly detalleCargado =
    signal(false);

  protected readonly tipoActivo =
    signal(true);

  protected readonly errorMessage =
    signal<string | null>(null);

  protected readonly successMessage =
    signal<string | null>(null);

  private readonly empresaFormulario =
    signal<string | null>(null);

  protected readonly form =
    this.fb.nonNullable.group({

      clave: [
        '',
        [
          Validators.required,
          Validators.maxLength(30),
        ],
      ],

      nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(150),
        ],
      ],

      descripcion: [
        '',
        Validators.maxLength(500),
      ],

    });

  constructor() {

    effect(onCleanup => {

      const empresaId =
        this.empresaContexto.seleccionada()?.id ??
        null;

      const puedeGestionar =
        this.puedeGestionar();

      this.form.reset();

      this.form.disable({
        emitEvent: false,
      });

      this.empresaFormulario.set(null);

      this.tipoActivo.set(true);

      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.detalleCargado.set(false);

      this.loading.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const consulta$: Observable<TipoContratoDetalle | null> =
        this.id
          ? this.service.getById(this.id)
          : of(null);

      const sub = consulta$.subscribe({

        next: detalle => {

          if (
            this.empresaContexto.empresaId !==
            empresaId
          ) {
            return;
          }

          if (detalle) {

            this.cargarFormulario(detalle);
          }

          if (puedeGestionar && !this.guardando()) {

            this.form.enable({
              emitEvent: false,
            });
          }

          this.form.markAsPristine();
          this.form.markAsUntouched();

          this.empresaFormulario.set(empresaId);

          this.detalleCargado.set(true);
          this.loading.set(false);
        },

        error: (error: unknown) => {

          if (
            this.empresaContexto.empresaId !==
            empresaId
          ) {
            return;
          }

          this.errorMessage.set(
            this.mensajeError(
              error,
              'No fue posible cargar el tipo de contrato.'
            )
          );

          this.loading.set(false);
        },
      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  private cargarFormulario(
    detalle: TipoContratoDetalle
  ): void {

    this.tipoActivo.set(detalle.activo);

    this.form.patchValue({

      clave: detalle.clave,

      nombre: detalle.nombre,

      descripcion:
        detalle.descripcion ?? '',

    });
  }

  protected async guardar(): Promise<void> {

    if (
      this.guardando() ||
      !this.detalleCargado() ||
      !this.puedeGestionar()
    ) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    const empresaId =
      this.empresaContexto.empresaId;

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
        'Revisa los campos del formulario.'
      );

      return;
    }

    const f =
      this.form.getRawValue();

    if (
      !f.clave.trim() ||
      !f.nombre.trim()
    ) {

      this.errorMessage.set(
        'La clave y el nombre son obligatorios.'
      );

      return;
    }

    const dto: TipoContratoGuardar = {

      clave:
        f.clave.trim().toUpperCase(),

      nombre:
        f.nombre.trim(),

      descripcion:
        f.descripcion.trim() || null,

    };

    this.guardando.set(true);

    this.form.disable({
      emitEvent: false,
    });

    try {

      if (this.id) {

        const actualizado =
          await firstValueFrom(
            this.service.update(
              this.id,
              dto
            )
          );

        if (
          this.empresaContexto.empresaId !==
          empresaId
        ) {
          return;
        }

        this.cargarFormulario(actualizado);

        this.form.markAsPristine();

        this.successMessage.set(
          'Tipo de contrato actualizado correctamente.'
        );

      } else {

        const creado =
          await firstValueFrom(
            this.service.create(dto)
          );

        if (
          this.empresaContexto.empresaId !==
          empresaId
        ) {
          return;
        }

        await this.router.navigate([
          '/admin/tipos-contrato',
          creado.id,
        ]);

      }

    } catch (error) {

      if (
        this.empresaContexto.empresaId ===
        empresaId
      ) {

        this.errorMessage.set(
          this.mensajeError(
            error,
            'No fue posible guardar el tipo de contrato.'
          )
        );
      }

    } finally {

      this.guardando.set(false);

      if (
        this.puedeGestionar() &&
        this.detalleCargado() &&
        this.empresaFormulario() ===
          this.empresaContexto.empresaId
      ) {

        this.form.enable({
          emitEvent: false,
        });
      }
    }
  }

  protected volver(): void {

    void this.router.navigate([
      '/admin/tipos-contrato',
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