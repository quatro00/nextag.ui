import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { ActivoAsignacionesService } from '../../../activo-asignaciones/services/activo-asignaciones.service';
import {
  ActivoAsignacion,
} from '../../../activo-asignaciones/types/activo-asignacion.types';
import { mensajeApi } from '../../../shared/api-error';

@Component({
  selector: 'app-activo-asignaciones',
  templateUrl: './activo-asignaciones.html',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export class ActivoAsignaciones {

  // ==========================================
  // INPUTS
  // ==========================================

  readonly activoId = input.required<string>();

  readonly activoEstadoId = input(1);

  readonly puedeGestionar = input(false);

  // ==========================================
  // SERVICIOS
  // ==========================================

  protected readonly empresa = inject(EmpresaContextoService);

  private readonly service = inject(ActivoAsignacionesService);

  private readonly router = inject(Router);

  // ==========================================
  // ESTADO
  // ==========================================

  private solicitud = 0;

  protected readonly historial =
    signal<ActivoAsignacion[]>([]);

  protected readonly cargando = signal(false);

  protected readonly error = signal<string | null>(null);

  // ==========================================
  // PROPIEDADES CALCULADAS
  // ==========================================

  protected readonly vigente = computed(() =>
    this.historial().find(x => x.vigente) ?? null
  );

  protected readonly totalAsignaciones = computed(() =>
    this.historial().length
  );

  protected readonly puedeAsignar = computed(() =>
    this.puedeGestionar() &&
    this.activoEstadoId() !== 7 &&
    !this.vigente()
  );

  protected readonly puedeOperarVigente = computed(() =>
    this.puedeGestionar() &&
    this.vigente() !== null
  );

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor() {

    effect((onCleanup) => {

      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      const activoId = this.activoId();

      const req = ++this.solicitud;

      this.historial.set([]);
      this.error.set(null);

      this.cargando.set(!!empresaId && !!activoId);

      if (!empresaId || !activoId) {
        return;
      }

      const sub = this.service
        .getHistorialActivo(activoId)
        .subscribe({

          next: items => {

            if (
              req !== this.solicitud ||
              this.empresa.empresaId !== empresaId ||
              this.activoId() !== activoId
            ) {
              return;
            }

            this.historial.set(items);
            this.cargando.set(false);
          },

          error: err => {

            if (
              req !== this.solicitud ||
              this.empresa.empresaId !== empresaId ||
              this.activoId() !== activoId
            ) {
              return;
            }

            this.error.set(
              mensajeApi(
                err,
                'No fue posible consultar las asignaciones del activo.'
              )
            );

            this.cargando.set(false);
          },
        });

      onCleanup(() => sub.unsubscribe());

    });
  }

  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  protected nuevaAsignacion(): void {

    if (!this.puedeAsignar()) {
      return;
    }

    void this.router.navigate(
      ['/admin/asignaciones/nueva'],
      {
        queryParams: {
          activoId: this.activoId(),
        },
      }
    );
  }

  protected verAsignacion(id: string): void {

    void this.router.navigate([
      '/admin/asignaciones',
      id,
    ]);
  }

  protected devolver(): void {

    const asignacion = this.vigente();

    if (!asignacion || !this.puedeOperarVigente()) {
      return;
    }

    void this.router.navigate(
      ['/admin/asignaciones', asignacion.id],
      {
        queryParams: {
          accion: 'devolver',
        },
      }
    );
  }

  protected reasignar(): void {

    const asignacion = this.vigente();

    if (!asignacion || !this.puedeOperarVigente()) {
      return;
    }

    void this.router.navigate(
      ['/admin/asignaciones', asignacion.id],
      {
        queryParams: {
          accion: 'reasignar',
        },
      }
    );
  }

  // ==========================================
  // RECARGAR
  // ==========================================

  protected async recargar(): Promise<void> {

    const empresaId = this.empresa.empresaId;

    const activoId = this.activoId();

    if (!empresaId || !activoId) {
      return;
    }

    const req = ++this.solicitud;

    this.cargando.set(true);
    this.error.set(null);

    try {

      const items = await firstValueFrom(
        this.service.getHistorialActivo(activoId)
      );

      if (
        req !== this.solicitud ||
        this.empresa.empresaId !== empresaId ||
        this.activoId() !== activoId
      ) {
        return;
      }

      this.historial.set(items);

    } catch (err) {

      if (
        req === this.solicitud &&
        this.empresa.empresaId === empresaId &&
        this.activoId() === activoId
      ) {
        this.error.set(
          mensajeApi(
            err,
            'No fue posible actualizar las asignaciones.'
          )
        );
      }

    } finally {

      if (req === this.solicitud) {
        this.cargando.set(false);
      }
    }
  }
}