import { Component, computed, effect, inject, signal } from '@angular/core';
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
import { SucursalesService } from '../../services/sucursales.service';
import { SucursalList } from '../../types/sucursal.types';

@Component({
  selector: 'app-sucursales-list',
  templateUrl: './sucursales-list.html',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export default class SucursalesList {
  private service = inject(SucursalesService);
  private router = inject(Router);
  private authService = inject(AuthService);

  protected empresaContexto = inject(EmpresaContextoService);

  protected sucursales = signal<SucursalList[]>([]);
  protected loading = signal(false);
  protected actualizandoId = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);
  protected busqueda = signal('');

  protected puedeGestionar = computed(() =>
    this.authService.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
    ])
  );

  protected total = computed(() => this.sucursales().length);

  protected activas = computed(() =>
    this.sucursales().filter(x => x.activo).length
  );

  protected inactivas = computed(() =>
    this.sucursales().filter(x => !x.activo).length
  );

  protected sucursalesFiltradas = computed(() => {
    const value = this.busqueda().trim().toLowerCase();

    if (!value) return this.sucursales();

    return this.sucursales().filter(x =>
      `${x.clave} ${x.nombre} ${x.municipio ?? ''} ${x.estado ?? ''} ${x.correo ?? ''}`
        .toLowerCase()
        .includes(value)
    );
  });

  constructor() {
    effect((onCleanup) => {
      const empresaId = this.empresaContexto.empresaId;

      this.sucursales.set([]);
      this.errorMessage.set(null);
      this.loading.set(!!empresaId);

      if (!empresaId) return;

      const subscription = this.service.getAll().subscribe({
        next: sucursales => {
          this.sucursales.set(sucursales);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('No fue posible cargar las sucursales.');
          this.loading.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected nuevo(): void {
    if (!this.puedeGestionar() || !this.empresaContexto.empresaId) return;

    void this.router.navigate(['/admin/sucursales/nuevo']);
  }

  protected editar(id: string): void {
    if (!this.puedeGestionar()) return;

    void this.router.navigate(['/admin/sucursales', id]);
  }

  protected async cambiarEstatus(sucursal: SucursalList): Promise<void> {
    if (!this.puedeGestionar() || this.actualizandoId() !== null) return;

    const empresaId = this.empresaContexto.empresaId;
    if (!empresaId) return;

    const activo = !sucursal.activo;
    const accion = activo ? 'activar' : 'desactivar';

    if (!confirm(`¿Deseas ${accion} la sucursal "${sucursal.nombre}"?`))
      return;

    this.actualizandoId.set(sucursal.id);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(
        this.service.updateStatus(sucursal.id, activo)
      );

      // Evita actualizar el listado si el usuario cambió de empresa.
      if (this.empresaContexto.empresaId !== empresaId) return;

      this.sucursales.update(items =>
        items.map(x =>
          x.id === sucursal.id ? { ...x, activo } : x
        )
      );
    } catch {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(
          'No fue posible actualizar el estatus de la sucursal.'
        );
      }
    } finally {
      this.actualizandoId.set(null);
    }
  }

  protected cambiarBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }
}