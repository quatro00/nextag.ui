import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AreasService } from '../../../areas/services/areas.services';
import { AreaList } from '../../../areas/types/area.types';
import { DepartamentoEstatusComponent } from '../../components/departamento-estatus/departamento-estatus';
import { DepartamentosService } from '../../services/departamentos.services';
import { DepartamentoList } from '../../types/departamento.types';

@Component({
  selector: 'app-departamentos-list',
  templateUrl: './departamentos-list.html',
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    DepartamentoEstatusComponent,
  ],
})
export default class DepartamentosList implements OnInit {
  private service = inject(DepartamentosService);
  private areasService = inject(AreasService);
  private router = inject(Router);

  protected departamentos = signal<DepartamentoList[]>([]);
  protected areas = signal<AreaList[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected busqueda = signal('');
  protected areaId = signal('');

  protected total = computed(() => this.departamentos().length);
  protected activos = computed(() => this.departamentos().filter(x => x.activo).length);
  protected inactivos = computed(() => this.departamentos().filter(x => !x.activo).length);

  protected departamentosFiltrados = computed(() => {
    const busqueda = this.busqueda().trim().toLowerCase();
    const areaId = this.areaId();

    return this.departamentos().filter(x => {
      const coincideArea = !areaId || x.areaId === areaId;
      const coincideBusqueda = !busqueda ||
        `${x.clave} ${x.nombre} ${x.descripcion ?? ''} ${x.areaClave} ${x.areaNombre}`
          .toLowerCase()
          .includes(busqueda);

      return coincideArea && coincideBusqueda;
    });
  });

  ngOnInit(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [departamentos, areas] = await Promise.all([
        firstValueFrom(this.service.getAll()),
        firstValueFrom(this.areasService.getAll()),
      ]);

      this.departamentos.set(departamentos);
      this.areas.set(areas);
    } catch {
      this.errorMessage.set('No fue posible cargar los departamentos.');
    } finally {
      this.loading.set(false);
    }
  }

  protected nuevo(): void {
    void this.router.navigate(['/admin/departamentos/nuevo']);
  }

  protected editar(id: string): void {
    void this.router.navigate(['/admin/departamentos', id]);
  }

  protected async cambiarEstatus(departamento: DepartamentoList): Promise<void> {
    try {
      await firstValueFrom(
        this.service.updateStatus(departamento.id, !departamento.activo)
      );

      this.departamentos.update(items =>
        items.map(x =>
          x.id === departamento.id
            ? { ...x, activo: !x.activo }
            : x
        )
      );
    } catch {
      this.errorMessage.set('No fue posible actualizar el estatus del departamento.');
    }
  }

  protected cambiarBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  protected cambiarArea(areaId: string): void {
    this.areaId.set(areaId);
  }
}