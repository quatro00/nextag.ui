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
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { SucursalesService } from '../../../sucursales/services/sucursales.service';
import { SucursalList } from '../../../sucursales/types/sucursal.types';
import { UbicacionesService } from '../../services/ubicaciones.service';
import {
  UbicacionFilaArbol,
  UbicacionList,
} from '../../types/ubicacion.types';

@Component({
  selector: 'app-ubicaciones-list',
  templateUrl: './ubicaciones-list.html',
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
export default class UbicacionesList {
  private service = inject(UbicacionesService);
  private sucursalesService = inject(SucursalesService);

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  protected empresaContexto = inject(EmpresaContextoService);

  // ==========================================
  // DATOS
  // ==========================================

  protected ubicaciones = signal<UbicacionList[]>([]);
  protected sucursales = signal<SucursalList[]>([]);

  protected loading = signal(false);
  protected actualizandoId = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);

  // ==========================================
  // FILTROS Y VISUALIZACION
  // ==========================================

  protected busqueda = signal('');

  protected sucursalFiltro = signal(
    this.route.snapshot.queryParamMap.get('sucursalId') ?? ''
  );

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
  // FILTROS
  // ==========================================

  protected ubicacionesSucursal = computed(() => {
    const sucursalId = this.sucursalFiltro();

    if (!sucursalId) {
      return this.ubicaciones();
    }

    return this.ubicaciones().filter(
      x => x.sucursalId === sucursalId
    );
  });

  protected ubicacionesFiltradas = computed(() => {
    const value = this.busqueda().trim().toLowerCase();

    if (!value) {
      return this.ubicacionesSucursal();
    }

    return this.ubicacionesSucursal().filter(x =>
      `${x.clave} ${x.nombre} ${x.descripcion ?? ''}
       ${x.sucursalNombre} ${x.tipoUbicacionNombre ?? ''}
       ${x.ubicacionPadreNombre ?? ''}`
        .toLowerCase()
        .includes(value)
    );
  });

  // ==========================================
  // INDICADORES
  // ==========================================

  protected total = computed(
    () => this.ubicacionesSucursal().length
  );

  protected activas = computed(
    () => this.ubicacionesSucursal().filter(x => x.activo).length
  );

  protected inactivas = computed(
    () => this.ubicacionesSucursal().filter(x => !x.activo).length
  );

  // ==========================================
  // VISTA JERARQUICA
  // ==========================================

  protected filasArbol = computed<UbicacionFilaArbol[]>(() => {
    const sucursalId = this.sucursalFiltro();

    if (!sucursalId) {
      return [];
    }

    const ubicaciones = this.ubicaciones().filter(
      x => x.sucursalId === sucursalId
    );

    const mapa = new Map(
      ubicaciones.map(x => [x.id, x])
    );

    const hijos = new Map<string, UbicacionList[]>();

    // Agrupar por ubicación padre.
    for (const ubicacion of ubicaciones) {
      const padreId = ubicacion.ubicacionPadreId;

      const clavePadre =
        padreId && mapa.has(padreId)
          ? padreId
          : '';

      const grupo = hijos.get(clavePadre) ?? [];

      grupo.push(ubicacion);

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

    // Si existe una búsqueda, incluir el resultado
    // y todos sus padres para conservar el contexto.
    if (busqueda) {
      for (const ubicacion of ubicaciones) {
        const texto =
          `${ubicacion.clave} ${ubicacion.nombre}
           ${ubicacion.descripcion ?? ''}
           ${ubicacion.tipoUbicacionNombre ?? ''}`
            .toLowerCase();

        if (!texto.includes(busqueda)) {
          continue;
        }

        let actual: UbicacionList | undefined = ubicacion;
        const visitados = new Set<string>();

        while (actual && !visitados.has(actual.id)) {
          visibles.add(actual.id);
          visitados.add(actual.id);

          actual = actual.ubicacionPadreId
            ? mapa.get(actual.ubicacionPadreId)
            : undefined;
        }
      }
    }

    const resultado: UbicacionFilaArbol[] = [];
    const colapsadas = this.colapsadas();

    const recorrer = (
      padreId: string,
      nivel: number,
      visitados: Set<string>
    ): void => {
      const elementos = hijos.get(padreId) ?? [];

      for (const ubicacion of elementos) {
        if (visitados.has(ubicacion.id)) {
          continue;
        }

        if (
          busqueda &&
          !visibles.has(ubicacion.id)
        ) {
          continue;
        }

        const elementosHijos = (
          hijos.get(ubicacion.id) ?? []
        ).filter(
          x => !busqueda || visibles.has(x.id)
        );

        const tieneHijos = elementosHijos.length > 0;

        resultado.push({
          ...ubicacion,
          nivel,
          tieneHijos,
        });

        // Durante la búsqueda se muestran los caminos
        // completos aunque un nodo esté colapsado.
        if (
          tieneHijos &&
          (busqueda || !colapsadas.has(ubicacion.id))
        ) {
          const nuevosVisitados = new Set(visitados);
          nuevosVisitados.add(ubicacion.id);

          recorrer(
            ubicacion.id,
            nivel + 1,
            nuevosVisitados
          );
        }
      }
    };

    recorrer('', 0, new Set());

    return resultado;
  });

  // ==========================================
  // CARGA POR EMPRESA
  // ==========================================

  constructor() {
    effect((onCleanup) => {
      const empresaId = this.empresaContexto.empresaId;

      this.ubicaciones.set([]);
      this.sucursales.set([]);
      this.errorMessage.set(null);
      this.loading.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const subscription = forkJoin({
        sucursales: this.sucursalesService.getAll(),
        ubicaciones: this.service.getAll(),
      }).subscribe({
        next: result => {
          this.sucursales.set(result.sucursales);
          this.ubicaciones.set(result.ubicaciones);

          // No conservar filtros de sucursales ajenas
          // a la empresa seleccionada.
          if (
            !result.sucursales.some(
              x => x.id === this.sucursalFiltro()
            )
          ) {
            this.sucursalFiltro.set('');
          }

          this.colapsadas.set(new Set());
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set(
            'No fue posible cargar las ubicaciones.'
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
    this.sucursalFiltro.set(id);
    this.colapsadas.set(new Set());
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
  // BUSQUEDA
  // ==========================================

  protected cambiarBusqueda(event: Event): void {
    this.busqueda.set(
      (event.target as HTMLInputElement).value
    );
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

    void this.router.navigate(
      ['/admin/ubicaciones/nuevo'],
      {
        queryParams: {
          sucursalId: this.sucursalFiltro() || null,
        },
      }
    );
  }

  protected editar(id: string): void {
    if (!this.puedeGestionar()) {
      return;
    }

    void this.router.navigate(
      ['/admin/ubicaciones', id],
      {
        queryParams: {
          sucursalId: this.sucursalFiltro() || null,
        },
      }
    );
  }

  // ==========================================
  // CAMBIAR ESTATUS
  // ==========================================

  protected async cambiarEstatus(
    ubicacion: UbicacionList
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

    const activo = !ubicacion.activo;
    const accion = activo ? 'activar' : 'desactivar';

    if (
      !confirm(
        `¿Deseas ${accion} la ubicación "${ubicacion.nombre}"?`
      )
    ) {
      return;
    }

    this.actualizandoId.set(ubicacion.id);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(
        this.service.updateStatus(
          ubicacion.id,
          activo
        )
      );

      if (this.empresaContexto.empresaId !== empresaId) {
        return;
      }

      this.ubicaciones.update(items =>
        items.map(x =>
          x.id === ubicacion.id
            ? { ...x, activo }
            : x
        )
      );
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(
          this.obtenerError(
            error,
            'No fue posible actualizar el estatus de la ubicación.'
          )
        );
      }
    } finally {
      this.actualizandoId.set(null);
    }
  }

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