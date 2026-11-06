import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom, forkJoin } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { CategoriasActivoService } from '../../../categorias-activo/services/categorias-activo.service';
import { CategoriaActivoList } from '../../../categorias-activo/types/categoria-activo.types';
import { SucursalesService } from '../../../sucursales/services/sucursales.service';
import { SucursalList } from '../../../sucursales/types/sucursal.types';
import { mensajeApi } from '../../../shared/api-error';
import { ActivosService } from '../../services/activos.service';
import { ActivoList, ActivoPagina, EstadoActivo } from '../../types/activo.types';

@Component({
  selector: 'app-activos-list',
  templateUrl: './activos-list.html',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, MatTooltipModule],
})
export default class ActivosList {
  protected readonly empresa = inject(EmpresaContextoService);
  private readonly service = inject(ActivosService);
  private readonly categoriasService = inject(CategoriasActivoService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private solicitud = 0;

  protected readonly items = signal<ActivoList[]>([]);
  protected readonly total = signal(0);
  protected readonly estados = signal<EstadoActivo[]>([]);
  protected readonly categorias = signal<CategoriaActivoList[]>([]);
  protected readonly sucursales = signal<SucursalList[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly texto = signal('');
  protected readonly buscarTexto = signal('');
  protected readonly estadoId = signal(0);
  protected readonly categoriaId = signal('');
  protected readonly sucursalId = signal('');
  protected readonly pagina = signal(1);
  protected readonly tamanoPagina = 20;
  protected readonly paginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamanoPagina)));
  protected readonly puedeGestionar = computed(() => this.auth.hasAnyRole([AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA]));

  constructor() {
    effect(onCleanup => {
      const empresaId = this.empresa.seleccionada()?.id ?? null;
      ++this.solicitud;
      this.items.set([]); this.total.set(0); this.estados.set([]);
      this.categorias.set([]); this.sucursales.set([]);
      this.texto.set(''); this.buscarTexto.set(''); this.estadoId.set(0);
      this.categoriaId.set(''); this.sucursalId.set(''); this.pagina.set(1);
      this.error.set(null); this.loading.set(!!empresaId);
      if (!empresaId) return;
      const req = ++this.solicitud;
      const sub = forkJoin({
        estados: this.service.getEstados(),
        categorias: this.categoriasService.getAll(),
        sucursales: this.sucursalesService.getAll(),
        pagina: this.service.getAll({ pagina: 1, tamanoPagina: this.tamanoPagina }),
      }).subscribe({
        next: datos => {
          if (req !== this.solicitud || this.empresa.empresaId !== empresaId) return;
          this.estados.set(datos.estados);
          this.categorias.set(datos.categorias);
          this.sucursales.set(datos.sucursales);
          this.colocarPagina(datos.pagina);
          this.loading.set(false);
        },
        error: err => {
          if (req !== this.solicitud || this.empresa.empresaId !== empresaId) return;
          this.error.set(mensajeApi(err, 'No fue posible consultar el inventario.'));
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected cambiarTexto(e: Event): void { this.texto.set((e.target as HTMLInputElement).value); }
  protected buscar(): void { this.buscarTexto.set(this.texto().trim()); this.pagina.set(1); void this.recargar(); }
  protected cambiarEstado(id: number): void { this.estadoId.set(id); this.pagina.set(1); void this.recargar(); }
  protected cambiarCategoria(id: string): void { this.categoriaId.set(id); this.pagina.set(1); void this.recargar(); }
  protected cambiarSucursal(id: string): void { this.sucursalId.set(id); this.pagina.set(1); void this.recargar(); }
  protected cambiarPagina(valor: number): void {
    if (valor < 1 || valor > this.paginas() || this.loading()) return;
    this.pagina.set(valor);
    void this.recargar();
  }
  protected limpiar(): void {
    this.texto.set(''); this.buscarTexto.set(''); this.estadoId.set(0);
    this.categoriaId.set(''); this.sucursalId.set(''); this.pagina.set(1);
    void this.recargar();
  }
  protected nuevo(): void { void this.router.navigate(['/admin/activos/nuevo']); }
  protected detalle(id: string): void { void this.router.navigate(['/admin/activos', id]); }

  private async recargar(): Promise<void> {
    const empresaId = this.empresa.empresaId;
    if (!empresaId) return;
    const req = ++this.solicitud;
    this.loading.set(true); this.error.set(null);
    try {
      const datos = await firstValueFrom(this.service.getAll({
        buscar: this.buscarTexto() || undefined,
        estadoActivoId: this.estadoId() || undefined,
        categoriaActivoId: this.categoriaId() || undefined,
        sucursalId: this.sucursalId() || undefined,
        pagina: this.pagina(), tamanoPagina: this.tamanoPagina,
      }));
      if (req !== this.solicitud || this.empresa.empresaId !== empresaId) return;
      this.colocarPagina(datos);
    } catch (err) {
      if (req === this.solicitud && this.empresa.empresaId === empresaId)
        this.error.set(mensajeApi(err, 'No fue posible actualizar el inventario.'));
    } finally {
      if (req === this.solicitud) this.loading.set(false);
    }
  }

  private colocarPagina(datos: ActivoPagina): void {
    this.items.set(datos.items);
    this.total.set(datos.total);
  }
}
