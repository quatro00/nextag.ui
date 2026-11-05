import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { CategoriasActivoService } from '../../services/categorias-activo.service';
import {
  CategoriaActivoFilaArbol,
  CategoriaActivoList,
} from '../../types/categoria-activo.types';

@Component({
  selector: 'app-categorias-activo-list',
  templateUrl: './categorias-activo-list.html',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export default class CategoriasActivoList {
  private service = inject(CategoriasActivoService);
  private router = inject(Router);
  private authService = inject(AuthService);

  protected empresaContexto = inject(EmpresaContextoService);

  // ==========================================
  // ESTADO
  // ==========================================

  protected categorias = signal<CategoriaActivoList[]>([]);

  protected loading = signal(false);
  protected actualizandoId = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);

  protected busqueda = signal('');

  protected vista = signal<'tabla' | 'arbol'>('tabla');

  protected colapsadas = signal<Set<string>>(new Set());

  // ==========================================
  // PERMISOS
  // ==========================================

  protected puedeGestionar = computed(() =>
    this.authService.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
    ])
  );

  // ==========================================
  // INDICADORES
  // ==========================================

  protected total = computed(() =>
    this.categorias().length
  );

  protected activas = computed(() =>
    this.categorias().filter(x => x.activo).length
  );

  protected inactivas = computed(() =>
    this.categorias().filter(x => !x.activo).length
  );

  // ==========================================
  // FILTRADO
  // ==========================================

  protected categoriasFiltradas = computed(() => {
    const value = this.busqueda().trim().toLowerCase();

    if (!value) {
      return this.categorias();
    }

    return this.categorias().filter(x =>
      `${x.clave} ${x.nombre} ${x.descripcion ?? ''}
       ${x.categoriaPadreNombre ?? ''}`
        .toLowerCase()
        .includes(value)
    );
  });

  // ==========================================
  // VISTA JERARQUICA
  // ==========================================

  protected filasArbol = computed<CategoriaActivoFilaArbol[]>(() => {
    const categorias = this.categorias();

    const mapa = new Map(
      categorias.map(x => [x.id, x])
    );

    const hijos = new Map<string, CategoriaActivoList[]>();

    // Agrupar categorías por padre.
    for (const categoria of categorias) {
      const padreId = categoria.categoriaPadreId;

      const clavePadre =
        padreId && mapa.has(padreId)
          ? padreId
          : '';

      const grupo = hijos.get(clavePadre) ?? [];

      grupo.push(categoria);

      hijos.set(clavePadre, grupo);
    }

    // Ordenar alfabéticamente cada nivel.
    for (const grupo of hijos.values()) {
      grupo.sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );
    }

    const busqueda = this.busqueda().trim().toLowerCase();

    const visibles = new Set<string>();

    // Cuando buscamos una categoría, mostramos
    // también sus padres para conservar el contexto.
    if (busqueda) {
      for (const categoria of categorias) {
        const texto = `
          ${categoria.clave}
          ${categoria.nombre}
          ${categoria.descripcion ?? ''}
          ${categoria.categoriaPadreNombre ?? ''}
        `.toLowerCase();

        if (!texto.includes(busqueda)) {
          continue;
        }

        let actual: CategoriaActivoList | undefined = categoria;

        const visitados = new Set<string>();

        while (actual && !visitados.has(actual.id)) {
          visibles.add(actual.id);
          visitados.add(actual.id);

          actual = actual.categoriaPadreId
            ? mapa.get(actual.categoriaPadreId)
            : undefined;
        }
      }
    }

    const resultado: CategoriaActivoFilaArbol[] = [];
    const colapsadas = this.colapsadas();

    // Protección adicional ante relaciones inconsistentes.
    const procesadas = new Set<string>();

    const recorrer = (
      padreId: string,
      nivel: number
    ): void => {
      const elementos = hijos.get(padreId) ?? [];

      for (const categoria of elementos) {
        if (procesadas.has(categoria.id)) {
          continue;
        }

        if (busqueda && !visibles.has(categoria.id)) {
          continue;
        }

        procesadas.add(categoria.id);

        const hijosVisibles = (
          hijos.get(categoria.id) ?? []
        ).filter(
          x => !busqueda || visibles.has(x.id)
        );

        const tieneHijos = hijosVisibles.length > 0;

        resultado.push({
          ...categoria,
          nivel,
          tieneHijos,
        });

        // Durante una búsqueda se expanden
        // automáticamente las coincidencias.
        if (
          tieneHijos &&
          (
            busqueda ||
            !colapsadas.has(categoria.id)
          )
        ) {
          recorrer(
            categoria.id,
            nivel + 1
          );
        }
      }
    };

    recorrer('', 0);

    return resultado;
  });

  // ==========================================
  // CARGA POR EMPRESA
  // ==========================================

  constructor() {
    effect((onCleanup) => {
      const empresaId = this.empresaContexto.empresaId;

      this.categorias.set([]);
      this.errorMessage.set(null);
      this.colapsadas.set(new Set());

      this.loading.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const subscription = this.service.getAll().subscribe({
        next: categorias => {
          if (this.empresaContexto.empresaId !== empresaId) {
            return;
          }

          this.categorias.set(categorias);
          this.loading.set(false);
        },

        error: () => {
          if (this.empresaContexto.empresaId !== empresaId) {
            return;
          }

          this.errorMessage.set(
            'No fue posible cargar las categorías de activos.'
          );

          this.loading.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  // ==========================================
  // BUSQUEDA
  // ==========================================

  protected cambiarBusqueda(event: Event): void {
    this.busqueda.set(
      (event.target as HTMLInputElement).value
    );
  }

  // ==========================================
  // CAMBIAR VISTA
  // ==========================================

  protected cambiarVista(
    vista: 'tabla' | 'arbol'
  ): void {
    this.vista.set(vista);
  }

  // ==========================================
  // EXPANDIR / CONTRAER
  // ==========================================

  protected alternarNodo(id: string): void {
    if (this.busqueda().trim()) {
      return;
    }

    this.colapsadas.update(actuales => {
      const siguiente = new Set(actuales);

      if (siguiente.has(id)) {
        siguiente.delete(id);
      } else {
        siguiente.add(id);
      }

      return siguiente;
    });
  }

  // ==========================================
  // NAVEGACION
  // ==========================================

  protected nuevo(): void {
    if (
      !this.puedeGestionar() ||
      !this.empresaContexto.empresaId
    ) {
      return;
    }

    void this.router.navigate([
      '/admin/categorias-activo/nuevo',
    ]);
  }

  protected editar(id: string): void {
    if (!this.puedeGestionar()) {
      return;
    }

    void this.router.navigate([
      '/admin/categorias-activo',
      id,
    ]);
  }

  // ==========================================
  // CAMBIAR ESTATUS
  // ==========================================

  protected async cambiarEstatus(
    categoria: CategoriaActivoList
  ): Promise<void> {
    if (
      !this.puedeGestionar() ||
      this.actualizandoId() !== null
    ) {
      return;
    }

    const empresaId = this.empresaContexto.empresaId;

    if (!empresaId) {
      return;
    }

    const activo = !categoria.activo;

    const accion = activo ? 'activar' : 'desactivar';

    const confirmado = confirm(
      `¿Deseas ${accion} la categoría "${categoria.nombre}"?`
    );

    if (!confirmado) {
      return;
    }

    this.actualizandoId.set(categoria.id);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(
        this.service.updateStatus(
          categoria.id,
          activo
        )
      );

      // No actualizar información de otra empresa.
      if (this.empresaContexto.empresaId !== empresaId) {
        return;
      }

      this.categorias.update(items =>
        items.map(x =>
          x.id === categoria.id
            ? { ...x, activo }
            : x
        )
      );
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(
          this.obtenerError(
            error,
            'No fue posible actualizar el estatus de la categoría.'
          )
        );
      }
    } finally {
      this.actualizandoId.set(null);
    }
  }

  // ==========================================
  // ERRORES
  // ==========================================

  private obtenerError(
    error: unknown,
    mensaje: string
  ): string {
    if (
      error instanceof HttpErrorResponse &&
      typeof error.error?.message === 'string'
    ) {
      return error.error.message;
    }

    return mensaje;
  }
}