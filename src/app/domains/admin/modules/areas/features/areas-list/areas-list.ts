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
import { AreaEstatusComponent } from '../../components/area-estatus/area-estatus';
import { AreasService } from '../../services/areas.services';
import { AreaList } from '../../types/area.types';

@Component({
  selector: 'app-areas-list',
  templateUrl: './areas-list.html',
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AreaEstatusComponent,
  ],
})
export default class AreasList implements OnInit {
  private service = inject(AreasService);
  private router = inject(Router);

  protected areas = signal<AreaList[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected busqueda = signal('');

  protected total = computed(() => this.areas().length);
  protected activas = computed(() => this.areas().filter(x => x.activo).length);
  protected inactivas = computed(() => this.areas().filter(x => !x.activo).length);

  protected areasFiltradas = computed(() => {
    const value = this.busqueda().trim().toLowerCase();
    if (!value) return this.areas();

    return this.areas().filter(x =>
      `${x.clave} ${x.nombre} ${x.descripcion ?? ''}`
        .toLowerCase()
        .includes(value)
    );
  });

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      this.areas.set(await firstValueFrom(this.service.getAll()));
    } catch {
      this.errorMessage.set('No fue posible cargar las áreas.');
    } finally {
      this.loading.set(false);
    }
  }

  nuevo(): void {
    void this.router.navigate(['/admin/areas/nuevo']);
  }

  editar(id: string): void {
    void this.router.navigate(['/admin/areas', id]);
  }

  async cambiarEstatus(area: AreaList): Promise<void> {
    try {
      await firstValueFrom(this.service.updateStatus(area.id, !area.activo));

      this.areas.update(items =>
        items.map(x => x.id === area.id ? { ...x, activo: !x.activo } : x)
      );
    } catch {
      this.errorMessage.set('No fue posible actualizar el estatus del área.');
    }
  }

  cambiarBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }
}