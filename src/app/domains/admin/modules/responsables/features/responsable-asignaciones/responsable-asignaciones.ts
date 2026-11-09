import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { mensajeApi } from '../../../shared/api-error';
import { ActivoAsignacionesService } from '../../../activo-asignaciones/services/activo-asignaciones.service';
import { ActivoAsignacion } from
  '../../../activo-asignaciones/types/activo-asignacion.types';

@Component({
  selector: 'app-responsable-asignaciones',

  templateUrl: './responsable-asignaciones.html',

  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export class ResponsableAsignaciones {

  // ==========================================
  // INPUTS
  // ==========================================

  readonly responsableId = input.required<string>();

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
  // CALCULADOS
  // ==========================================

  protected readonly vigentes = computed(() =>
    this.historial().filter(x => x.vigente)
  );

  protected readonly finalizadas = computed(() =>
    this.historial().filter(x => !x.vigente)
  );

  protected readonly totalVigentes = computed(() =>
    this.vigentes().length
  );

  protected readonly totalFinalizadas = computed(() =>
    this.finalizadas().length
  );

  protected readonly totalAsignaciones = computed(() =>
    this.historial().length
  );

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor() {

    effect((onCleanup) => {

      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      const responsableId = this.responsableId();

      const req = ++this.solicitud;

      this.historial.set([]);
      this.error.set(null);

      this.cargando.set(!!empresaId && !!responsableId);

      if (!empresaId || !responsableId) {
        return;
      }

      const sub = this.service
        .getHistorialResponsable(responsableId)
        .subscribe({

          next: items => {

            if (
              req !== this.solicitud ||
              this.empresa.empresaId !== empresaId ||
              this.responsableId() !== responsableId
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
              this.responsableId() !== responsableId
            ) {
              return;
            }

            this.error.set(
              mensajeApi(
                err,
                'No fue posible consultar las asignaciones del responsable.'
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

  protected verActivo(activoId: string): void {

    void this.router.navigate([
      '/admin/activos',
      activoId,
    ]);
  }

  protected verAsignacion(asignacionId: string): void {

    void this.router.navigate([
      '/admin/asignaciones',
      asignacionId,
    ]);
  }

  protected devolver(asignacionId: string): void {

    if (!this.puedeGestionar()) {
      return;
    }

    void this.router.navigate(
      ['/admin/asignaciones', asignacionId],
      {
        queryParams: {
          accion: 'devolver',
        },
      }
    );
  }

  protected reasignar(asignacionId: string): void {

    if (!this.puedeGestionar()) {
      return;
    }

    void this.router.navigate(
      ['/admin/asignaciones', asignacionId],
      {
        queryParams: {
          accion: 'reasignar',
        },
      }
    );
  }

  // ==========================================
  // ACTUALIZAR
  // ==========================================

  protected async recargar(): Promise<void> {

    const empresaId = this.empresa.empresaId;

    const responsableId = this.responsableId();

    if (!empresaId || !responsableId) {
      return;
    }

    const req = ++this.solicitud;

    this.cargando.set(true);
    this.error.set(null);

    try {

      const items = await firstValueFrom(
        this.service.getHistorialResponsable(responsableId)
      );

      if (
        req !== this.solicitud ||
        this.empresa.empresaId !== empresaId ||
        this.responsableId() !== responsableId
      ) {
        return;
      }

      this.historial.set(items);

    } catch (err) {

      if (
        req === this.solicitud &&
        this.empresa.empresaId === empresaId &&
        this.responsableId() === responsableId
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