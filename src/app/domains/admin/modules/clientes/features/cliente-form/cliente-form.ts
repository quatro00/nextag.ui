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
import { ClientesService } from '../../services/clientes.service';
import {
  ClienteDetalle,
  ClienteGuardar,
} from '../../types/cliente.types';

@Component({
  selector: 'app-cliente-form',
  templateUrl: './cliente-form.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export default class ClienteForm {

  private readonly fb =
    inject(FormBuilder);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly service =
    inject(ClientesService);

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
      return 'Nuevo cliente';
    }

    return this.puedeGestionar()
      ? 'Editar cliente'
      : 'Consultar cliente';
  });

  protected readonly loading =
    signal(false);

  protected readonly guardando =
    signal(false);

  protected readonly detalleCargado =
    signal(false);

  protected readonly clienteActivo =
    signal(true);

  protected readonly errorMessage =
    signal<string | null>(null);

  protected readonly successMessage =
    signal<string | null>(null);

  protected readonly form =
    this.fb.nonNullable.group({

      clave: [
        '',
        [
          Validators.required,
          Validators.maxLength(50),
        ],
      ],

      nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(200),
        ],
      ],

      razonSocial: [
        '',
        Validators.maxLength(250),
      ],

      rfc: [
        '',
        Validators.maxLength(13),
      ],

      correo: [
        '',
        [
          Validators.email,
          Validators.maxLength(200),
        ],
      ],

      telefono: [
        '',
        Validators.maxLength(30),
      ],

      sitioWeb: [
        '',
        Validators.maxLength(250),
      ],

      direccion: [
        '',
        Validators.maxLength(300),
      ],

      colonia: [
        '',
        Validators.maxLength(150),
      ],

      municipio: [
        '',
        Validators.maxLength(150),
      ],

      estado: [
        '',
        Validators.maxLength(150),
      ],

      pais: [
        '',
        Validators.maxLength(100),
      ],

      codigoPostal: [
        '',
        Validators.maxLength(15),
      ],

      contactoPrincipal: [
        '',
        Validators.maxLength(200),
      ],

      telefonoContacto: [
        '',
        Validators.maxLength(30),
      ],

      correoContacto: [
        '',
        [
          Validators.email,
          Validators.maxLength(200),
        ],
      ],

      observaciones: [
        '',
        Validators.maxLength(1000),
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

      this.clienteActivo.set(true);

      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.detalleCargado.set(false);
      this.loading.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const consulta$: Observable<ClienteDetalle | null> = this.id
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

          } else {

            this.form.patchValue({
              pais: 'México',
            });
          }

          if (puedeGestionar) {

            this.form.enable({
              emitEvent: false,
            });
          }

          this.form.markAsPristine();
          this.form.markAsUntouched();

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
              'No fue posible cargar los datos del cliente.'
            )
          );

          this.loading.set(false);
        },

      });

      onCleanup(() => sub.unsubscribe());

    });
  }

  private cargarFormulario(
    detalle: ClienteDetalle
  ): void {

    this.clienteActivo.set(detalle.activo);

    this.form.patchValue({

      clave: detalle.clave,

      nombre: detalle.nombre,

      razonSocial: detalle.razonSocial ?? '',

      rfc: detalle.rfc ?? '',

      correo: detalle.correo ?? '',

      telefono: detalle.telefono ?? '',

      sitioWeb: detalle.sitioWeb ?? '',

      direccion: detalle.direccion ?? '',

      colonia: detalle.colonia ?? '',

      municipio: detalle.municipio ?? '',

      estado: detalle.estado ?? '',

      pais: detalle.pais ?? '',

      codigoPostal: detalle.codigoPostal ?? '',

      contactoPrincipal:
        detalle.contactoPrincipal ?? '',

      telefonoContacto:
        detalle.telefonoContacto ?? '',

      correoContacto:
        detalle.correoContacto ?? '',

      observaciones:
        detalle.observaciones ?? '',

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

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      this.errorMessage.set(
        'Revisa los campos del formulario.'
      );

      return;
    }

    const empresaId =
      this.empresaContexto.empresaId;

    if (!empresaId) {

      this.errorMessage.set(
        'Debes seleccionar una empresa.'
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

    const dto: ClienteGuardar = {

      clave:
        f.clave.trim().toUpperCase(),

      nombre:
        f.nombre.trim(),

      razonSocial:
        this.nullIfEmpty(f.razonSocial),

      rfc:
        this.nullIfEmpty(f.rfc)?.toUpperCase() ??
        null,

      correo:
        this.nullIfEmpty(f.correo),

      telefono:
        this.nullIfEmpty(f.telefono),

      sitioWeb:
        this.nullIfEmpty(f.sitioWeb),

      direccion:
        this.nullIfEmpty(f.direccion),

      colonia:
        this.nullIfEmpty(f.colonia),

      municipio:
        this.nullIfEmpty(f.municipio),

      estado:
        this.nullIfEmpty(f.estado),

      pais:
        this.nullIfEmpty(f.pais),

      codigoPostal:
        this.nullIfEmpty(f.codigoPostal),

      contactoPrincipal:
        this.nullIfEmpty(f.contactoPrincipal),

      telefonoContacto:
        this.nullIfEmpty(f.telefonoContacto),

      correoContacto:
        this.nullIfEmpty(f.correoContacto),

      observaciones:
        this.nullIfEmpty(f.observaciones),

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
          'Datos del cliente guardados correctamente.'
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

        this.form.markAsPristine();

        await this.router.navigate([
          '/admin/clientes',
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
            'No fue posible guardar el cliente.'
          )
        );
      }

    } finally {

      this.guardando.set(false);

      if (
        this.empresaContexto.empresaId === empresaId &&
        this.puedeGestionar() &&
        this.detalleCargado()
      ) {

        this.form.enable({
          emitEvent: false,
        });
      }
    }
  }

  protected volver(): void {

    void this.router.navigate([
      '/admin/clientes',
    ]);
  }

  private nullIfEmpty(
    valor: string
  ): string | null {

    return valor.trim() || null;
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