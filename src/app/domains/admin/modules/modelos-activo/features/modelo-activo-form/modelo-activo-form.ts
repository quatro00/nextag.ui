import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { CategoriasActivoService } from '../../../categorias-activo/services/categorias-activo.service';
import { CategoriaActivoList } from '../../../categorias-activo/types/categoria-activo.types';
import { MarcasService } from '../../../marcas/services/marcas.service';
import { MarcaList } from '../../../marcas/types/marca.types';
import { ModelosActivoService } from '../../services/modelos-activo.service';
import { ModeloActivoCreate } from '../../types/modelo-activo.types';

@Component({
  selector: 'app-modelo-activo-form',
  templateUrl: './modelo-activo-form.html',
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
export default class ModeloActivoForm {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ModelosActivoService);
  private readonly marcasService = inject(MarcasService);
  private readonly categoriasService = inject(CategoriasActivoService);
  protected readonly empresaContexto = inject(EmpresaContextoService);

  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly esEdicion = !!this.id;
  protected readonly loading = signal(false);
  protected readonly guardando = signal(false);
  protected readonly detalleCargado = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly marcas = signal<MarcaList[]>([]);
  protected readonly categorias = signal<CategoriaActivoList[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    marcaId: ['', Validators.required],
    categoriaActivoId: ['', Validators.required],
    clave: ['', [Validators.required, Validators.maxLength(50)]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: ['', Validators.maxLength(500)],
  });

  constructor() {
    effect((onCleanup) => {
      const empresaId = this.empresaContexto.seleccionada()?.id ?? null;
      this.form.reset();
      this.marcas.set([]);
      this.categorias.set([]);
      this.errorMessage.set(null);
      this.detalleCargado.set(false);
      this.loading.set(!!empresaId);
      if (!empresaId) return;

      const sub = forkJoin({
        marcas: this.marcasService.getAll(),
        categorias: this.categoriasService.getAll(),
        detalle: this.id ? this.service.getById(this.id) : of(null),
      }).subscribe({
        next: datos => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.marcas.set(datos.marcas);
          this.categorias.set(datos.categorias);
          if (datos.detalle) {
            this.form.patchValue({
              marcaId: datos.detalle.marcaId,
              categoriaActivoId: datos.detalle.categoriaActivoId,
              clave: datos.detalle.clave,
              nombre: datos.detalle.nombre,
              descripcion: datos.detalle.descripcion ?? '',
            });
          }
          this.detalleCargado.set(true);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.errorMessage.set(this.mensajeError(error, 'No fue posible cargar los datos del modelo.'));
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  /** La API exige que la categoría y todos sus superiores estén activos. */
  protected categoriaValida(categoriaId: string): boolean {
    const mapa = new Map(this.categorias().map(x => [x.id, x]));
    let actual: CategoriaActivoList | undefined = mapa.get(categoriaId);
    const visitados = new Set<string>();
    if (!actual) return false;

    while (actual) {
      if (!actual.activo || !visitados.add(actual.id)) return false;
      if (!actual.categoriaPadreId) return true;
      actual = mapa.get(actual.categoriaPadreId);
    }
    return false;
  }

  protected async guardar(): Promise<void> {
    if (this.guardando() || !this.detalleCargado()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const empresaId = this.empresaContexto.empresaId;
    if (!empresaId) {
      this.errorMessage.set('Debes seleccionar una empresa.');
      return;
    }

    const datos = this.form.getRawValue();
    if (!datos.clave.trim() || !datos.nombre.trim()) {
      this.errorMessage.set('La clave y el nombre son obligatorios.');
      return;
    }
    if (!this.marcas().some(x => x.id === datos.marcaId && x.activo)) {
      this.errorMessage.set('Selecciona una marca activa.');
      return;
    }
    if (!this.categoriaValida(datos.categoriaActivoId)) {
      this.errorMessage.set('Selecciona una categoría activa cuyos superiores estén activos.');
      return;
    }

    const dto: ModeloActivoCreate = {
      marcaId: datos.marcaId,
      categoriaActivoId: datos.categoriaActivoId,
      clave: datos.clave.trim().toUpperCase(),
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim() || null,
    };

    this.guardando.set(true);
    this.errorMessage.set(null);
    try {
      if (this.id) await firstValueFrom(this.service.update(this.id, dto));
      else await firstValueFrom(this.service.create(dto));
      if (this.empresaContexto.empresaId === empresaId) {
        await this.router.navigate(['/admin/modelos-activo']);
      }
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(this.mensajeError(error, 'No fue posible guardar el modelo.'));
      }
    } finally {
      this.guardando.set(false);
    }
  }

  protected cancelar(): void {
    void this.router.navigate(['/admin/modelos-activo']);
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return fallback;
  }
}
