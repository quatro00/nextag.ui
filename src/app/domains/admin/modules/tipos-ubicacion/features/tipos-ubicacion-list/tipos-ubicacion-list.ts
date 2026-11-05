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
import { TiposUbicacionService } from '../../services/tipos-ubicacion.service';
import { TipoUbicacionList } from '../../types/tipo-ubicacion.types';

@Component({
  selector: 'app-tipos-ubicacion-list',
  templateUrl: './tipos-ubicacion-list.html',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export default class TiposUbicacionList {
  private service = inject(TiposUbicacionService);
  private router = inject(Router);
  private authService = inject(AuthService);

  protected empresaContexto = inject(EmpresaContextoService);

  protected tipos = signal<TipoUbicacionList[]>([]);

  protected loading = signal(false);
  protected actualizandoId = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);
  protected busqueda = signal('');

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
    this.tipos().length
  );

  protected activos = computed(() =>
    this.tipos().filter(x => x.activo).length
  );

  protected inactivos = computed(() =>
    this.tipos().filter(x => !x.activo).length
  );

  // ==========================================
  // BUSQUEDA
  // ==========================================

  protected tiposFiltrados = computed(() => {
    const value = this.busqueda().trim().toLowerCase();

    if (!value) {
      return this.tipos();
    }

    return this.tipos().filter(x =>
      `${x.clave} ${x.nombre} ${x.descripcion ?? ''}`
        .toLowerCase()
        .includes(value)
    );
  });

  // ==========================================
  // CONTEXTO EMPRESARIAL
  // ==========================================

  constructor() {
    effect((onCleanup) => {
      const empresaId = this.empresaContexto.empresaId;

      this.tipos.set([]);
      this.errorMessage.set(null);
      this.loading.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const subscription = this.service.getAll().subscribe({
        next: tipos => {
          this.tipos.set(tipos);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set(
            'No fue posible cargar los tipos de ubicación.'
          );

          this.loading.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
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
      '/admin/tipos-ubicacion/nuevo',
    ]);
  }

  protected editar(id: string): void {
    if (!this.puedeGestionar()) {
      return;
    }

    void this.router.navigate([
      '/admin/tipos-ubicacion',
      id,
    ]);
  }

  // ==========================================
  // CAMBIAR ESTATUS
  // ==========================================

  protected async cambiarEstatus(
    tipo: TipoUbicacionList
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

    const activo = !tipo.activo;
    const accion = activo ? 'activar' : 'desactivar';

    const confirmar = confirm(
      `¿Deseas ${accion} el tipo de ubicación "${tipo.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    this.actualizandoId.set(tipo.id);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(
        this.service.updateStatus(tipo.id, activo)
      );

      // Evita modificar el listado si cambió la empresa.
      if (this.empresaContexto.empresaId !== empresaId) {
        return;
      }

      this.tipos.update(items =>
        items.map(x =>
          x.id === tipo.id
            ? { ...x, activo }
            : x
        )
      );
    } catch {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(
          'No fue posible actualizar el estatus del tipo de ubicación.'
        );
      }
    } finally {
      this.actualizandoId.set(null);
    }
  }

  // ==========================================
  // BUSQUEDA
  // ==========================================

  protected cambiarBusqueda(event: Event): void {
    this.busqueda.set(
      (event.target as HTMLInputElement).value
    );
  }
}