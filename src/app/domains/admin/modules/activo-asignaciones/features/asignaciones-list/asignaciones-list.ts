import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { mensajeApi } from '../../../shared/api-error';
import { ActivoAsignacionesService } from '../../services/activo-asignaciones.service';
import {
  ActivoAsignacion,
  ActivoAsignacionPagina,
} from '../../types/activo-asignacion.types';

@Component({
  selector: 'app-asignaciones-list',
  templateUrl: './asignaciones-list.html',
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
export default class AsignacionesList {

  protected readonly empresa = inject(EmpresaContextoService);

  private readonly service = inject(ActivoAsignacionesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private solicitud = 0;

  protected readonly items = signal<ActivoAsignacion[]>([]);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly texto = signal('');
  protected readonly buscarTexto = signal('');

  protected readonly tipo =
    signal<'' | 'PERSONA' | 'AREA'>('');

  protected readonly estatus =
    signal<'todos' | 'vigentes' | 'finalizadas'>('todos');

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

      const solicitudActual = ++this.solicitud;

      this.items.set([]);
      this.total.set(0);
      this.pagina.set(1);

      this.texto.set('');
      this.buscarTexto.set('');
      this.tipo.set('');
      this.estatus.set('todos');

      this.error.set(null);
      this.loading.set(!!empresaId);

      if (!empresaId) return;

      const sub = this.service.getAll({
        pagina: 1,
        tamanoPagina: this.tamanoPagina,
      }).subscribe({

        next: resultado => {

          if (
            solicitudActual !== this.solicitud ||
            this.empresa.empresaId !== empresaId
          ) return;

          this.colocarPagina(resultado);
          this.loading.set(false);
        },

        error: err => {

          if (
            solicitudActual !== this.solicitud ||
            this.empresa.empresaId !== empresaId
          ) return;

          this.error.set(
            mensajeApi(
              err,
              'No fue posible consultar las asignaciones.'
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

  protected cambiarTipo(tipo: '' | 'PERSONA' | 'AREA'): void {
    this.tipo.set(tipo);
    this.pagina.set(1);
    void this.recargar();
  }

  protected cambiarEstatus(
    valor: 'todos' | 'vigentes' | 'finalizadas'
  ): void {
    this.estatus.set(valor);
    this.pagina.set(1);
    void this.recargar();
  }

  protected cambiarPagina(valor: number): void {

    if (
      valor < 1 ||
      valor > this.paginas() ||
      this.loading()
    ) return;

    this.pagina.set(valor);
    void this.recargar();
  }

  protected limpiar(): void {
    this.texto.set('');
    this.buscarTexto.set('');
    this.tipo.set('');
    this.estatus.set('todos');
    this.pagina.set(1);
    void this.recargar();
  }

  protected nueva(): void {
    if (!this.puedeGestionar()) return;

    void this.router.navigate([
      '/admin/asignaciones/nueva',
    ]);
  }

  protected detalle(id: string): void {
    void this.router.navigate([
      '/admin/asignaciones',
      id,
    ]);
  }

  private async recargar(): Promise<void> {

    const empresaId = this.empresa.empresaId;

    if (!empresaId) return;

    const solicitudActual = ++this.solicitud;

    this.loading.set(true);
    this.error.set(null);

    try {

      const resultado = await firstValueFrom(
        this.service.getAll({

          buscar: this.buscarTexto() || undefined,

          tipoResponsable:
            this.tipo() || undefined,

          vigente:
            this.estatus() === 'todos'
              ? undefined
              : this.estatus() === 'vigentes',

          pagina: this.pagina(),
          tamanoPagina: this.tamanoPagina,
        })
      );

      if (
        solicitudActual !== this.solicitud ||
        this.empresa.empresaId !== empresaId
      ) return;

      this.colocarPagina(resultado);

    } catch (err) {

      if (
        solicitudActual === this.solicitud &&
        this.empresa.empresaId === empresaId
      ) {
        this.error.set(
          mensajeApi(
            err,
            'No fue posible actualizar las asignaciones.'
          )
        );
      }

    } finally {

      if (solicitudActual === this.solicitud) {
        this.loading.set(false);
      }
    }
  }

  private colocarPagina(
    resultado: ActivoAsignacionPagina
  ): void {

    this.items.set(resultado.items);
    this.total.set(resultado.total);
  }
}