import { DatePipe } from '@angular/common';

import {
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmpresaContextoService } from
  '@/app/core/empresa-contexto.service';
import { mensajeApi } from '../../../shared/api-error';
import { ActivoMovimientosService } from
  '../../services/activo-movimientos.service';
import { ActivoMovimiento } from
  '../../types/activo-movimiento.types';

@Component({
  selector: 'app-movimiento-detalle',
  templateUrl: './movimiento-detalle.html',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export default class MovimientoDetalle {

  protected readonly empresa =
    inject(EmpresaContextoService);

  private readonly service =
    inject(ActivoMovimientosService);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly detalle =
    signal<ActivoMovimiento | null>(null);

  protected readonly cargando = signal(false);

  protected readonly error =
    signal<string | null>(null);

  constructor() {

    effect((onCleanup) => {

      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      const id = this.route.snapshot.paramMap.get('id');

      this.detalle.set(null);
      this.error.set(null);

      this.cargando.set(!!empresaId && !!id);

      if (!empresaId || !id) return;

      const sub = this.service.getById(id)
        .subscribe({

          next: resultado => {

            if (this.empresa.empresaId !== empresaId) return;

            this.detalle.set(resultado);
            this.cargando.set(false);
          },

          error: err => {

            if (this.empresa.empresaId !== empresaId) return;

            this.error.set(
              mensajeApi(
                err,
                'No fue posible cargar el movimiento.'
              )
            );

            this.cargando.set(false);
          },
        });

      onCleanup(() => sub.unsubscribe());

    });
  }

  protected abrirActivo(): void {

    const activoId = this.detalle()?.activoId;

    if (!activoId) return;

    void this.router.navigate([
      '/admin/activos',
      activoId,
    ]);
  }

  protected volver(): void {

    void this.router.navigate([
      '/admin/movimientos',
    ]);
  }
}