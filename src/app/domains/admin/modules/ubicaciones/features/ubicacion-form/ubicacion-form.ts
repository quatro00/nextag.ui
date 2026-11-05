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
import { SucursalesService } from '../../../sucursales/services/sucursales.service';
import { SucursalList } from '../../../sucursales/types/sucursal.types';
import { TiposUbicacionService } from '../../../tipos-ubicacion/services/tipos-ubicacion.service';
import { TipoUbicacionList } from '../../../tipos-ubicacion/types/tipo-ubicacion.types';
import { UbicacionesService } from '../../services/ubicaciones.service';
import {
  UbicacionCreate,
  UbicacionList,
} from '../../types/ubicacion.types';

@Component({
  selector: 'app-ubicacion-form',
  templateUrl: './ubicacion-form.html',
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
export default class UbicacionForm {
  private fb = inject(FormBuilder);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private service = inject(UbicacionesService);

  private sucursalesService = inject(SucursalesService);
  private tiposService = inject(TiposUbicacionService);

  protected empresaContexto = inject(EmpresaContextoService);

  // ==========================================
  // IDENTIFICADOR
  // ==========================================

  protected id = this.route.snapshot.paramMap.get('id');

  protected esEdicion = !!this.id;

  // ==========================================
  // ESTADO
  // ==========================================

  protected loading = signal(false);
  protected guardando = signal(false);
  protected detalleCargado = signal(false);

  protected errorMessage = signal<string | null>(null);

  // ==========================================
  // CATALOGOS
  // ==========================================

  protected sucursales = signal<SucursalList[]>([]);
  protected tipos = signal<TipoUbicacionList[]>([]);
  protected ubicaciones = signal<UbicacionList[]>([]);

  protected sucursalSeleccionada = signal('');

  protected tipoOriginalId = signal<string | null>(null);

  // ==========================================
  // FORMULARIO
  // ==========================================

  protected form = this.fb.nonNullable.group({
    sucursalId: [
      '',
      Validators.required,
    ],

    tipoUbicacionId: [''],

    ubicacionPadreId: [''],

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

    descripcion: [
      '',
      Validators.maxLength(500),
    ],
  });

  // ==========================================
  // TIPOS DISPONIBLES
  // ==========================================

  protected tiposDisponibles = computed(() => {
    return this.tipos()
      .filter(
        x =>
          x.activo ||
          (
            this.esEdicion &&
            x.id === this.tipoOriginalId()
          )
      )
      .sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );
  });

  // ==========================================
  // UBICACIONES PADRE DISPONIBLES
  // ==========================================

  protected padresDisponibles = computed(() => {
    const sucursalId = this.sucursalSeleccionada();

    if (!sucursalId) {
      return [];
    }

    const ubicacionesSucursal = this.ubicaciones().filter(
      x => x.sucursalId === sucursalId
    );

    const mapa = new Map(
      ubicacionesSucursal.map(x => [x.id, x])
    );

    /**
     * No puede elegirse:
     * - La ubicación actual.
     * - Alguno de sus descendientes.
     * - Una ubicación inactiva.
     */
    const esDescendiente = (
      posiblePadre: UbicacionList
    ): boolean => {

      if (!this.id) {
        return false;
      }

      if (posiblePadre.id === this.id) {
        return true;
      }

      let actual: UbicacionList | undefined = posiblePadre;

      const visitados = new Set<string>();

      while (
        actual?.ubicacionPadreId &&
        !visitados.has(actual.id)
      ) {
        visitados.add(actual.id);

        if (actual.ubicacionPadreId === this.id) {
          return true;
        }

        actual = mapa.get(
          actual.ubicacionPadreId
        );
      }

      return false;
    };

    return ubicacionesSucursal
      .filter(
        x =>
          x.activo &&
          !esDescendiente(x)
      )
      .sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );
  });

  // ==========================================
  // CARGA INICIAL
  // ==========================================

  constructor() {
    effect((onCleanup) => {
      const empresaId = this.empresaContexto.empresaId;

      this.form.reset();

      this.form.controls.sucursalId.enable({
        emitEvent: false,
      });

      this.sucursales.set([]);
      this.tipos.set([]);
      this.ubicaciones.set([]);

      this.sucursalSeleccionada.set('');
      this.tipoOriginalId.set(null);

      this.errorMessage.set(null);
      this.detalleCargado.set(false);

      this.loading.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const subscription = forkJoin({
        sucursales: this.sucursalesService.getAll(),

        tipos: this.tiposService.getAll(),

        ubicaciones: this.service.getAll(),

        detalle: this.id
          ? this.service.getById(this.id)
          : of(null),
      }).subscribe({
        next: result => {
          if (this.empresaContexto.empresaId !== empresaId) {
            return;
          }

          this.sucursales.set(result.sucursales);
          this.tipos.set(result.tipos);
          this.ubicaciones.set(result.ubicaciones);

          // ==================================
          // EDICION
          // ==================================

          if (result.detalle) {
            const ubicacion = result.detalle;

            this.form.patchValue({
              sucursalId: ubicacion.sucursalId,

              tipoUbicacionId:
                ubicacion.tipoUbicacionId ?? '',

              ubicacionPadreId:
                ubicacion.ubicacionPadreId ?? '',

              clave: ubicacion.clave,
              nombre: ubicacion.nombre,

              descripcion:
                ubicacion.descripcion ?? '',
            });

            this.sucursalSeleccionada.set(
              ubicacion.sucursalId
            );

            this.tipoOriginalId.set(
              ubicacion.tipoUbicacionId
            );

            // No permitimos cambiar la sucursal
            // de una ubicación existente.
            this.form.controls.sucursalId.disable({
              emitEvent: false,
            });
          }

          // ==================================
          // CREACION
          // ==================================

          else {
            const sucursalRuta =
              this.route.snapshot.queryParamMap.get(
                'sucursalId'
              );

            const sucursal = result.sucursales.find(
              x =>
                x.id === sucursalRuta &&
                x.activo
            );

            if (sucursal) {
              this.form.controls.sucursalId.setValue(
                sucursal.id
              );

              this.sucursalSeleccionada.set(
                sucursal.id
              );
            }
          }

          this.detalleCargado.set(true);
          this.loading.set(false);
        },

        error: () => {
          this.errorMessage.set(
            'No fue posible cargar la información de la ubicación.'
          );

          this.loading.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  // ==========================================
  // CAMBIAR SUCURSAL
  // ==========================================

  protected cambiarSucursal(id: string): void {
    this.sucursalSeleccionada.set(id);

    // Limpiar ubicación padre porque
    // pertenece a una sucursal específica.
    this.form.controls.ubicacionPadreId.setValue('');
  }

  // ==========================================
  // GUARDAR
  // ==========================================

  protected async guardar(): Promise<void> {
    if (
      this.guardando() ||
      !this.detalleCargado()
    ) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const empresaId = this.empresaContexto.empresaId;

    if (!empresaId) {
      this.errorMessage.set(
        'Debes seleccionar una empresa.'
      );

      return;
    }

    const value = this.form.getRawValue();

    if (!value.sucursalId) {
      this.errorMessage.set(
        'Debes seleccionar una sucursal.'
      );

      return;
    }

    if (
      !value.clave.trim() ||
      !value.nombre.trim()
    ) {
      this.errorMessage.set(
        'La clave y el nombre son obligatorios.'
      );

      return;
    }

    const dto: UbicacionCreate = {
      sucursalId: value.sucursalId,

      tipoUbicacionId:
        value.tipoUbicacionId || null,

      ubicacionPadreId:
        value.ubicacionPadreId || null,

      clave: value.clave.trim().toUpperCase(),

      nombre: value.nombre.trim(),

      descripcion: this.nullIfEmpty(
        value.descripcion
      ),
    };

    this.guardando.set(true);
    this.errorMessage.set(null);

    try {
      if (this.esEdicion && this.id) {
        await firstValueFrom(
          this.service.update(
            this.id,
            dto
          )
        );
      } else {
        await firstValueFrom(
          this.service.create(dto)
        );
      }

      if (this.empresaContexto.empresaId === empresaId) {
        await this.router.navigate(
          ['/admin/ubicaciones'],
          {
            queryParams: {
              sucursalId: dto.sucursalId,
            },
          }
        );
      }
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(
          this.getErrorMessage(error)
        );
      }
    } finally {
      this.guardando.set(false);
    }
  }

  // ==========================================
  // CANCELAR
  // ==========================================

  protected cancelar(): void {
    const sucursalId =
      this.route.snapshot.queryParamMap.get('sucursalId');

    void this.router.navigate(
      ['/admin/ubicaciones'],
      {
        queryParams: {
          sucursalId: sucursalId || null,
        },
      }
    );
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private nullIfEmpty(value: string): string | null {
    return value.trim() || null;
  }

  private getErrorMessage(error: unknown): string {
    if (
      error instanceof HttpErrorResponse &&
      typeof error.error?.message === 'string'
    ) {
      return error.error.message;
    }

    return 'No fue posible guardar la ubicación.';
  }
}