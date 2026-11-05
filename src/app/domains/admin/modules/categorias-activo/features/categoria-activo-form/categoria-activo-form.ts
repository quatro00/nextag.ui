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
import { CategoriasActivoService } from '../../services/categorias-activo.service';
import {
  CategoriaActivoCreate,
  CategoriaActivoList,
} from '../../types/categoria-activo.types';

@Component({
  selector: 'app-categoria-activo-form',
  templateUrl: './categoria-activo-form.html',
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
export default class CategoriaActivoForm {
  private fb = inject(FormBuilder);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private service = inject(CategoriasActivoService);

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

  protected categorias = signal<CategoriaActivoList[]>([]);

  // ==========================================
  // FORMULARIO
  // ==========================================

  protected form = this.fb.nonNullable.group({
    categoriaPadreId: [''],

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
  // CATEGORIAS PADRE DISPONIBLES
  // ==========================================

  protected padresDisponibles = computed(() => {
    const categorias = this.categorias();

    const mapa = new Map(
      categorias.map(x => [x.id, x])
    );

    /**
     * Una categoría no puede seleccionar:
     * - A sí misma.
     * - A sus descendientes.
     * - A una categoría inactiva.
     * - A una categoría cuyos superiores
     *   se encuentren inactivos.
     */
    const esPadreValido = (
      posiblePadre: CategoriaActivoList
    ): boolean => {
      if (!posiblePadre.activo) {
        return false;
      }

      let actual: CategoriaActivoList | undefined = posiblePadre;

      const visitados = new Set<string>();

      while (actual) {
        if (visitados.has(actual.id)) {
          return false;
        }

        visitados.add(actual.id);

        if (this.id && actual.id === this.id) {
          return false;
        }

        if (!actual.activo) {
          return false;
        }

        actual = actual.categoriaPadreId
          ? mapa.get(actual.categoriaPadreId)
          : undefined;
      }

      return true;
    };

    return categorias
      .filter(esPadreValido)
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

      this.categorias.set([]);
      this.errorMessage.set(null);

      this.detalleCargado.set(false);
      this.loading.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const subscription = forkJoin({
        categorias: this.service.getAll(),

        detalle: this.id
          ? this.service.getById(this.id)
          : of(null),
      }).subscribe({
        next: result => {
          if (this.empresaContexto.empresaId !== empresaId) {
            return;
          }

          this.categorias.set(result.categorias);

          if (result.detalle) {
            const categoria = result.detalle;

            this.form.patchValue({
              categoriaPadreId:
                categoria.categoriaPadreId ?? '',

              clave: categoria.clave,

              nombre: categoria.nombre,

              descripcion: categoria.descripcion ?? '',
            });
          }

          this.detalleCargado.set(true);
          this.loading.set(false);
        },

        error: () => {
          if (this.empresaContexto.empresaId !== empresaId) {
            return;
          }

          this.errorMessage.set(
            'No fue posible cargar la información de la categoría.'
          );

          this.loading.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
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

    // ==================================
    // VALIDACIONES
    // ==================================

    if (!value.clave.trim() || !value.nombre.trim()) {
      this.errorMessage.set(
        'La clave y el nombre son obligatorios.'
      );

      return;
    }

    const categoriaPadreId = value.categoriaPadreId || null;

    // Protección adicional contra selección
    // de padres no válidos.
    if (
      categoriaPadreId &&
      !this.padresDisponibles().some(
        x => x.id === categoriaPadreId
      )
    ) {
      this.errorMessage.set(
        'La categoría padre seleccionada no es válida.'
      );

      return;
    }

    const dto: CategoriaActivoCreate = {
      categoriaPadreId,

      clave: value.clave.trim().toUpperCase(),

      nombre: value.nombre.trim(),

      descripcion: this.nullIfEmpty(
        value.descripcion
      ),
    };

    // ==================================
    // GUARDAR
    // ==================================

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
        await this.router.navigate([
          '/admin/categorias-activo',
        ]);
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
    void this.router.navigate([
      '/admin/categorias-activo',
    ]);
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

    return 'No fue posible guardar la categoría.';
  }
}