import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmpresasService } from '../../services/empresas.service';
import { EmpresaList } from '../../types/empresa.types';

@Component({
  selector: 'app-empresas-list',
  templateUrl: './empresas-list.html',
  imports: [DatePipe, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatTooltipModule],
})
export default class EmpresasList implements OnInit {
  private service = inject(EmpresasService);
  private router = inject(Router);

  protected empresas = signal<EmpresaList[]>([]);
  protected loading = signal(false);
  protected actualizandoId = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);
  protected busqueda = signal('');

  protected total = computed(() => this.empresas().length);
  protected activas = computed(() => this.empresas().filter(x => x.activo).length);
  protected inactivas = computed(() => this.empresas().filter(x => !x.activo).length);

  protected empresasFiltradas = computed(() => {
    const value = this.busqueda().trim().toLowerCase();
    if (!value) return this.empresas();
    return this.empresas().filter(x =>
      `${x.clave} ${x.nombre} ${x.razonSocial ?? ''} ${x.rfc ?? ''} ${x.correo ?? ''}`.toLowerCase().includes(value)
    );
  });

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      this.empresas.set(await firstValueFrom(this.service.getAll()));
    } catch {
      this.errorMessage.set('No fue posible cargar las empresas.');
    } finally {
      this.loading.set(false);
    }
  }

  nuevo(): void {
    void this.router.navigate(['/admin/empresas/nuevo']);
  }

  editar(id: string): void {
    void this.router.navigate(['/admin/empresas', id]);
  }

  async cambiarEstatus(empresa: EmpresaList): Promise<void> {
    if (this.actualizandoId() !== null) return;
    const activo = !empresa.activo;
    const accion = activo ? 'activar' : 'desactivar';
    if (!confirm(`¿Deseas ${accion} la empresa "${empresa.nombre}"?`)) return;

    this.actualizandoId.set(empresa.id);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.service.updateStatus(empresa.id, activo));
      this.empresas.update(items => items.map(x => x.id === empresa.id ? { ...x, activo } : x));
    } catch {
      this.errorMessage.set('No fue posible actualizar el estatus de la empresa.');
    } finally {
      this.actualizandoId.set(null);
    }
  }

  cambiarBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }
}