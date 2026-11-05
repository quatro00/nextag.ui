import { HttpErrorResponse } from '@angular/common/http';
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
import { MarcasService } from '../../services/marcas.service';
import { MarcaList } from '../../types/marca.types';

@Component({
  selector: 'app-marcas-list',
  templateUrl: './marcas-list.html',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export default class MarcasList {
  private readonly service = inject(MarcasService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  protected readonly empresaContexto = inject(EmpresaContextoService);

  protected readonly marcas = signal<MarcaList[]>([]);
  protected readonly loading = signal(false);
  protected readonly actualizandoId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly busqueda = signal('');

  protected readonly puedeGestionar = computed(() =>
    this.authService.hasAnyRole([AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA])
  );

  protected readonly total = computed(() => this.marcas().length);
  protected readonly activas = computed(() => this.marcas().filter(x => x.activo).length);
  protected readonly inactivas = computed(() => this.marcas().filter(x => !x.activo).length);

  protected readonly marcasFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase();
    return !texto
      ? this.marcas()
      : this.marcas().filter(x =>
          `${x.clave} ${x.nombre} ${x.descripcion ?? ''}`.toLocaleLowerCase().includes(texto)
        );
  });

  constructor() {
    effect((onCleanup) => {
      // Leer la señal de selección hace reactiva la recarga al cambiar de empresa.
      const empresaId = this.empresaContexto.seleccionada()?.id ?? null;
      this.marcas.set([]);
      this.errorMessage.set(null);
      this.busqueda.set('');
      this.actualizandoId.set(null);
      this.loading.set(!!empresaId);
      if (!empresaId) return;

      const sub = this.service.getAll().subscribe({
        next: marcas => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.marcas.set(marcas);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.errorMessage.set(this.mensajeError(error, 'No fue posible cargar las marcas.'));
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected cambiarBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  protected nuevo(): void {
    if (!this.puedeGestionar() || !this.empresaContexto.empresaId) return;
    void this.router.navigate(['/admin/marcas/nuevo']);
  }

  protected editar(id: string): void {
    if (!this.puedeGestionar() || !this.empresaContexto.empresaId) return;
    void this.router.navigate(['/admin/marcas', id]);
  }

  protected async cambiarEstatus(marca: MarcaList): Promise<void> {
    if (!this.puedeGestionar() || this.actualizandoId() !== null) return;
    const empresaId = this.empresaContexto.empresaId;
    if (!empresaId) return;

    const activo = !marca.activo;
    if (!confirm(`¿Deseas ${activo ? 'activar' : 'desactivar'} la marca "${marca.nombre}"?`)) return;

    this.actualizandoId.set(marca.id);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.service.updateStatus(marca.id, activo));
      if (this.empresaContexto.empresaId !== empresaId) return;
      this.marcas.update(items => items.map(x => x.id === marca.id ? { ...x, activo } : x));
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(this.mensajeError(error, 'No fue posible actualizar la marca.'));
      }
    } finally {
      if (this.actualizandoId() === marca.id) this.actualizandoId.set(null);
    }
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return fallback;
  }
}
