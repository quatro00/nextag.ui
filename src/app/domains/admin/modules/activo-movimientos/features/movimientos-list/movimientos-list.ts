import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom, forkJoin } from 'rxjs';
import { EmpresaContextoService } from
  '@/app/core/empresa-contexto.service';
import { AuthService } from
  '@/app/domains/auth/services/auth.services';
import { AUTH_ROLES } from
  '@/app/domains/auth/constants/auth.roles';
import { mensajeApi } from '../../../shared/api-error';
import { ActivoMovimientosService } from
  '../../services/activo-movimientos.service';
import {
  ActivoMovimiento,
  ActivoMovimientoPagina,
  TipoMovimientoActivo,
} from '../../types/activo-movimiento.types';

@Component({
  selector: 'app-movimientos-list',
  templateUrl: './movimientos-list.html',
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
})
export default class MovimientosList {

  protected readonly empresa =
    inject(EmpresaContextoService);

  private readonly service =
    inject(ActivoMovimientosService);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private solicitud = 0;

  protected readonly items =
    signal<ActivoMovimiento[]>([]);

  protected readonly tipos =
    signal<TipoMovimientoActivo[]>([]);

  protected readonly loading = signal(false);

  protected readonly error =
    signal<string | null>(null);

  protected readonly texto = signal('');
  protected readonly buscarTexto = signal('');

  protected readonly tipoId =
    signal<number | null>(null);

  protected readonly pagina = signal(1);
  protected readonly tamanoPagina = 20;

  protected readonly total = signal(0);

  protected readonly paginas = computed(() =>
    Math.max(
      1,
      Math.ceil(this.total() / this.tamanoPagina)
    )
  );

  protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
    ])
  );

  constructor() {

    effect((onCleanup) => {

      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      const req = ++this.solicitud;

      this.items.set([]);
      this.tipos.set([]);

      this.total.set(0);
      this.pagina.set(1);

      this.texto.set('');
      this.buscarTexto.set('');

      this.tipoId.set(null);

      this.error.set(null);
      this.loading.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const sub = forkJoin({
        movimientos: this.service.getAll({
          pagina: 1,
          tamanoPagina: this.tamanoPagina,
        }),
        tipos: this.service.getTipos(),
      }).subscribe({

        next: datos => {

          if (
            req !== this.solicitud ||
            this.empresa.empresaId !== empresaId
          ) {
            return;
          }

          this.colocarPagina(datos.movimientos);

          this.tipos.set(datos.tipos);

          this.loading.set(false);
        },

        error: err => {

          if (
            req !== this.solicitud ||
            this.empresa.empresaId !== empresaId
          ) {
            return;
          }

          this.error.set(
            mensajeApi(
              err,
              'No fue posible consultar los movimientos.'
            )
          );

          this.loading.set(false);
        },
      });

      onCleanup(() => sub.unsubscribe());

    });
  }

  protected cambiarTexto(event: Event): void {

    this.texto.set(
      (event.target as HTMLInputElement).value
    );
  }

  protected buscar(): void {

    this.buscarTexto.set(this.texto().trim());

    this.pagina.set(1);

    void this.recargar();
  }

  protected cambiarTipo(
    valor: number | null
  ): void {

    this.tipoId.set(valor);

    this.pagina.set(1);

    void this.recargar();
  }

  protected limpiar(): void {

    this.texto.set('');
    this.buscarTexto.set('');

    this.tipoId.set(null);

    this.pagina.set(1);

    void this.recargar();
  }

  protected cambiarPagina(valor: number): void {

    if (
      valor < 1 ||
      valor > this.paginas() ||
      this.loading()
    ) {
      return;
    }

    this.pagina.set(valor);

    void this.recargar();
  }

  protected nuevo(): void {

    if (!this.puedeGestionar()) {
      return;
    }

    void this.router.navigate([
      '/admin/movimientos/nuevo',
    ]);
  }

  protected detalle(id: string): void {

    void this.router.navigate([
      '/admin/movimientos',
      id,
    ]);
  }

  private async recargar(): Promise<void> {

    const empresaId = this.empresa.empresaId;

    if (!empresaId) {
      return;
    }

    const req = ++this.solicitud;

    this.loading.set(true);
    this.error.set(null);

    try {

      const resultado = await firstValueFrom(
        this.service.getAll({

          buscar:
            this.buscarTexto() || undefined,

          tipoMovimientoActivoId:
            this.tipoId() ?? undefined,

          pagina: this.pagina(),

          tamanoPagina: this.tamanoPagina,
        })
      );

      if (
        req !== this.solicitud ||
        this.empresa.empresaId !== empresaId
      ) {
        return;
      }

      this.colocarPagina(resultado);

    } catch (err) {

      if (
        req === this.solicitud &&
        this.empresa.empresaId === empresaId
      ) {
        this.error.set(
          mensajeApi(
            err,
            'No fue posible actualizar los movimientos.'
          )
        );
      }

    } finally {

      if (req === this.solicitud) {
        this.loading.set(false);
      }
    }
  }

  private colocarPagina(
    resultado: ActivoMovimientoPagina
  ): void {

    this.items.set(resultado.items);

    this.total.set(resultado.total);
  }
}