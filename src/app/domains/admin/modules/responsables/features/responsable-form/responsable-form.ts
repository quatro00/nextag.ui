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
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { SucursalesService } from '../../../sucursales/services/sucursales.service';
import { SucursalList } from '../../../sucursales/types/sucursal.types';
import { ResponsablesService } from '../../services/responsables.service';
import {
  Responsable,
  ResponsableGuardar,
  TipoResponsable,
} from '../../types/responsable.types';

@Component({
  selector: 'app-responsable-form',
  templateUrl: './responsable-form.html',
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
export default class ResponsableForm {

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly service = inject(ResponsablesService);
  private readonly sucursalesService = inject(SucursalesService);

  private readonly auth = inject(AuthService);

  protected readonly empresaContexto =
    inject(EmpresaContextoService);

  protected readonly id =
    this.route.snapshot.paramMap.get('id');

  protected readonly esEdicion = !!this.id;

  protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
    ])
  );

  protected readonly loading = signal(false);
  protected readonly guardando = signal(false);
  protected readonly detalleCargado = signal(false);

  protected readonly sucursales =
    signal<SucursalList[]>([]);

  protected readonly areas =
    signal<Responsable[]>([]);

  protected readonly tipo =
    signal<TipoResponsable>('PERSONA');

  protected readonly errorMessage =
    signal<string | null>(null);

  protected readonly successMessage =
    signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({

    tipo: this.fb.nonNullable.control<TipoResponsable>(
      'PERSONA',
      Validators.required
    ),

    nombre: [
      '',
      [
        Validators.required,
        Validators.maxLength(200),
      ],
    ],

    codigo: ['', Validators.maxLength(50)],

    puesto: ['', Validators.maxLength(100)],

    departamento: ['', Validators.maxLength(150)],

    sucursalId: [''],

    areaResponsableId: [''],

    contacto: ['', Validators.maxLength(150)],

    correo: [
      '',
      [
        Validators.email,
        Validators.maxLength(256),
      ],
    ],

    telefono: ['', Validators.maxLength(30)],

    observaciones: [
      '',
      Validators.maxLength(500),
    ],
  });

  constructor() {

    effect((onCleanup) => {

      const empresaId =
        this.empresaContexto.seleccionada()?.id ?? null;

      this.form.reset();
      this.form.enable({ emitEvent: false });

      this.tipo.set('PERSONA');

      this.sucursales.set([]);
      this.areas.set([]);

      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.detalleCargado.set(false);
      this.loading.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const sub = forkJoin({

        sucursales: this.sucursalesService.getAll(true),

        areas: this.service.getAll({
          tipo: 'AREA',
          activo: true,
          pagina: 1,
          tamanoPagina: 100,
        }),

        detalle: this.id
          ? this.service.getById(this.id)
          : of(null),

      }).subscribe({

        next: datos => {

          if (this.empresaContexto.empresaId !== empresaId) {
            return;
          }

          this.sucursales.set(datos.sucursales);
          this.areas.set(datos.areas.items);

          if (datos.detalle) {

            const d = datos.detalle;

            this.tipo.set(d.tipo);

            this.form.patchValue({

              tipo: d.tipo,
              nombre: d.nombre,
              codigo: d.codigo ?? '',

              puesto: d.puesto ?? '',
              departamento: d.departamento ?? '',

              sucursalId: d.sucursalId ?? '',

              areaResponsableId:
                d.areaResponsableId ?? '',

              contacto: d.contacto ?? '',

              correo: d.correo ?? '',
              telefono: d.telefono ?? '',

              observaciones:
                d.observaciones ?? '',
            });

            // El tipo no puede cambiarse después del registro.
            this.form.controls.tipo.disable({
              emitEvent: false,
            });
          }

          if (!this.puedeGestionar()) {
            this.form.disable({ emitEvent: false });
          }

          this.detalleCargado.set(true);
          this.loading.set(false);
        },

        error: error => {

          if (this.empresaContexto.empresaId !== empresaId) {
            return;
          }

          this.errorMessage.set(
            this.mensajeError(
              error,
              'No fue posible cargar el responsable.'
            )
          );

          this.loading.set(false);
        },
      });

      onCleanup(() => sub.unsubscribe());

    });
  }

  protected cambiarTipo(
    tipo: TipoResponsable
  ): void {

    if (this.esEdicion) {
      return;
    }

    this.tipo.set(tipo);

    if (tipo === 'AREA') {

      this.form.patchValue({
        puesto: '',
        departamento: '',
        areaResponsableId: '',
      });

    } else {

      this.form.patchValue({
        contacto: '',
      });
    }
  }

  protected async guardar(): Promise<void> {

    if (
      this.guardando() ||
      !this.detalleCargado() ||
      !this.puedeGestionar()
    ) {
      return;
    }

    if (this.form.invalid) {

      this.form.markAllAsTouched();
      return;
    }

    const empresaId = this.empresaContexto.empresaId;

    if (!empresaId) {
      return;
    }

    const f = this.form.getRawValue();

    if (!f.nombre.trim()) {

      this.errorMessage.set(
        'El nombre del responsable es obligatorio.'
      );

      return;
    }

    const dto: ResponsableGuardar = {

      tipo: f.tipo,

      nombre: f.nombre.trim(),

      codigo: this.nullIfEmpty(f.codigo)?.toUpperCase() ?? null,

      puesto: f.tipo === 'PERSONA'
        ? this.nullIfEmpty(f.puesto)
        : null,

      departamento: f.tipo === 'PERSONA'
        ? this.nullIfEmpty(f.departamento)
        : null,

      sucursalId: f.sucursalId || null,

      areaResponsableId: f.tipo === 'PERSONA'
        ? f.areaResponsableId || null
        : null,

      contacto: f.tipo === 'AREA'
        ? this.nullIfEmpty(f.contacto)
        : null,

      correo: this.nullIfEmpty(f.correo),

      telefono: this.nullIfEmpty(f.telefono),

      observaciones:
        this.nullIfEmpty(f.observaciones),
    };

    this.guardando.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {

      if (this.id) {

        await firstValueFrom(
          this.service.update(this.id, dto)
        );

        if (this.empresaContexto.empresaId === empresaId) {

          this.successMessage.set(
            'Responsable actualizado correctamente.'
          );

          this.form.markAsPristine();
        }

      } else {

        const creado = await firstValueFrom(
          this.service.create(dto)
        );

        if (this.empresaContexto.empresaId === empresaId) {

          await this.router.navigate([
            '/admin/responsables',
            creado.id,
          ]);
        }
      }

    } catch (error) {

      if (this.empresaContexto.empresaId === empresaId) {

        this.errorMessage.set(
          this.mensajeError(
            error,
            'No fue posible guardar el responsable.'
          )
        );
      }

    } finally {

      this.guardando.set(false);
    }
  }

  protected volver(): void {

    void this.router.navigate([
      '/admin/responsables',
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

    if (
      error instanceof HttpErrorResponse &&
      typeof error.error?.message === 'string'
    ) {
      return error.error.message;
    }

    return fallback;
  }
}