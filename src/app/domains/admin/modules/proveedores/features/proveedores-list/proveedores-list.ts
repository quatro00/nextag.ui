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
import { ProveedoresService } from '../../services/proveedores.service';
import { TiposProveedorService } from '../../services/tipos-proveedor.service';
import { ProveedorList, TipoProveedor } from '../../types/proveedor.types';

@Component({
  selector: 'app-proveedores-list',
  templateUrl: './proveedores-list.html',
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
export default class ProveedoresList {
  private readonly service = inject(ProveedoresService);
  private readonly tiposService = inject(TiposProveedorService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly empresaContexto = inject(EmpresaContextoService);

  protected readonly proveedores = signal<ProveedorList[]>([]);
  protected readonly tipos = signal<TipoProveedor[]>([]);
  protected readonly loading = signal(false);
  protected readonly actualizandoId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly tipoFiltro = signal<number>(0);
  protected readonly estatusFiltro = signal<'todos' | 'activos' | 'inactivos'>('todos');

  protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA])
  );

  protected readonly total = computed(() => this.proveedores().length);
  protected readonly activos = computed(() => this.proveedores().filter(x => x.activo).length);
  protected readonly inactivos = computed(() => this.proveedores().filter(x => !x.activo).length);

  protected readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const tipoId = this.tipoFiltro();
    const estatus = this.estatusFiltro();
    return this.proveedores().filter(x =>
      (!tipoId || x.tipoProveedorIds.includes(tipoId)) &&
      (estatus === 'todos' || x.activo === (estatus === 'activos')) &&
      (!texto || `${x.clave} ${x.nombre} ${x.razonSocial ?? ''} ${x.rfc ?? ''} ${x.correo ?? ''}`
        .toLowerCase().includes(texto))
    );
  });

  constructor() {
    effect(onCleanup => {
      const empresaId = this.empresaContexto.seleccionada()?.id ?? null;
      this.proveedores.set([]);
      this.tipos.set([]);
      this.errorMessage.set(null);
      this.busqueda.set('');
      this.tipoFiltro.set(0);
      this.estatusFiltro.set('todos');
      this.actualizandoId.set(null);
      this.loading.set(!!empresaId);
      if (!empresaId) return;

      const sub = forkJoin({
        proveedores: this.service.getAll(),
        tipos: this.tiposService.getAll(),
      }).subscribe({
        next: datos => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.proveedores.set(datos.proveedores);
          this.tipos.set(datos.tipos);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.errorMessage.set(this.mensajeError(error, 'No fue posible cargar los proveedores.'));
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected cambiarBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  protected cambiarTipo(tipoId: number): void {
    this.tipoFiltro.set(tipoId);
  }

  protected cambiarEstatusFiltro(valor: 'todos' | 'activos' | 'inactivos'): void {
    this.estatusFiltro.set(valor);
  }

  protected nuevo(): void {
    if (!this.puedeGestionar() || !this.empresaContexto.empresaId) return;
    void this.router.navigate(['/admin/proveedores/nuevo']);
  }

  protected verDetalle(id: string): void {
    if (!this.empresaContexto.empresaId) return;
    void this.router.navigate(['/admin/proveedores', id]);
  }

  protected async cambiarEstatus(proveedor: ProveedorList): Promise<void> {
    if (!this.puedeGestionar() || this.actualizandoId() !== null) return;
    const empresaId = this.empresaContexto.empresaId;
    if (!empresaId) return;

    const activo = !proveedor.activo;
    const accion = activo ? 'activar' : 'desactivar';
    if (!confirm(`¿Deseas ${accion} al proveedor "${proveedor.nombre}"?`)) return;

    this.actualizandoId.set(proveedor.id);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.service.updateStatus(proveedor.id, activo));
      if (this.empresaContexto.empresaId !== empresaId) return;
      this.proveedores.update(items => items.map(x =>
        x.id === proveedor.id ? { ...x, activo } : x
      ));
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(this.mensajeError(error, 'No fue posible actualizar el estatus del proveedor.'));
      }
    } finally {
      if (this.actualizandoId() === proveedor.id) this.actualizandoId.set(null);
    }
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return fallback;
  }
}
