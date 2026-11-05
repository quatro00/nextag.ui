import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { CategoriasActivoService } from '../../../categorias-activo/services/categorias-activo.service';
import { CategoriaActivoList } from '../../../categorias-activo/types/categoria-activo.types';
import { MarcasService } from '../../../marcas/services/marcas.service';
import { MarcaList } from '../../../marcas/types/marca.types';
import { ModelosActivoService } from '../../services/modelos-activo.service';
import { ModeloActivoList } from '../../types/modelo-activo.types';

@Component({
  selector: 'app-modelos-activo-list',
  templateUrl: './modelos-activo-list.html',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
  ],
})
export default class ModelosActivoList {
  private readonly service = inject(ModelosActivoService);
  private readonly marcasService = inject(MarcasService);
  private readonly categoriasService = inject(CategoriasActivoService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  protected readonly empresaContexto = inject(EmpresaContextoService);

  protected readonly modelos = signal<ModeloActivoList[]>([]);
  protected readonly marcas = signal<MarcaList[]>([]);
  protected readonly categorias = signal<CategoriaActivoList[]>([]);
  protected readonly loading = signal(false);
  protected readonly actualizandoId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly marcaFiltro = signal('');
  protected readonly categoriaFiltro = signal('');

  protected readonly puedeGestionar = computed(() =>
    this.authService.hasAnyRole([AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA])
  );

  protected readonly modelosPorFiltros = computed(() =>
    this.modelos().filter(x =>
      (!this.marcaFiltro() || x.marcaId === this.marcaFiltro()) &&
      (!this.categoriaFiltro() || x.categoriaActivoId === this.categoriaFiltro())
    )
  );

  protected readonly total = computed(() => this.modelosPorFiltros().length);
  protected readonly activos = computed(() => this.modelosPorFiltros().filter(x => x.activo).length);
  protected readonly inactivos = computed(() => this.modelosPorFiltros().filter(x => !x.activo).length);

  protected readonly modelosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase();
    return !texto
      ? this.modelosPorFiltros()
      : this.modelosPorFiltros().filter(x =>
          `${x.clave} ${x.nombre} ${x.descripcion ?? ''} ${x.marcaNombre} ${x.categoriaActivoNombre}`
            .toLocaleLowerCase().includes(texto)
        );
  });

  constructor() {
    effect((onCleanup) => {
      const empresaId = this.empresaContexto.seleccionada()?.id ?? null;
      this.modelos.set([]);
      this.marcas.set([]);
      this.categorias.set([]);
      this.busqueda.set('');
      this.marcaFiltro.set('');
      this.categoriaFiltro.set('');
      this.actualizandoId.set(null);
      this.errorMessage.set(null);
      this.loading.set(!!empresaId);
      if (!empresaId) return;

      const sub = forkJoin({
        modelos: this.service.getAll(),
        marcas: this.marcasService.getAll(),
        categorias: this.categoriasService.getAll(),
      }).subscribe({
        next: datos => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.modelos.set(datos.modelos);
          this.marcas.set(datos.marcas);
          this.categorias.set(datos.categorias);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.errorMessage.set(this.mensajeError(error, 'No fue posible cargar los modelos.'));
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected cambiarBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  protected cambiarMarca(id: string): void {
    this.marcaFiltro.set(id);
  }

  protected cambiarCategoria(id: string): void {
    this.categoriaFiltro.set(id);
  }

  protected nuevo(): void {
    if (!this.puedeGestionar() || !this.empresaContexto.empresaId) return;
    void this.router.navigate(['/admin/modelos-activo/nuevo']);
  }

  protected editar(id: string): void {
    if (!this.puedeGestionar() || !this.empresaContexto.empresaId) return;
    void this.router.navigate(['/admin/modelos-activo', id]);
  }

  protected async cambiarEstatus(modelo: ModeloActivoList): Promise<void> {
    if (!this.puedeGestionar() || this.actualizandoId() !== null) return;
    const empresaId = this.empresaContexto.empresaId;
    if (!empresaId) return;

    const activo = !modelo.activo;
    if (!confirm(`¿Deseas ${activo ? 'activar' : 'desactivar'} el modelo "${modelo.nombre}"?`)) return;

    this.actualizandoId.set(modelo.id);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.service.updateStatus(modelo.id, activo));
      if (this.empresaContexto.empresaId !== empresaId) return;
      this.modelos.update(items => items.map(x => x.id === modelo.id ? { ...x, activo } : x));
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(this.mensajeError(error, 'No fue posible actualizar el modelo.'));
      }
    } finally {
      if (this.actualizandoId() === modelo.id) this.actualizandoId.set(null);
    }
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return fallback;
  }
}
