import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { firstValueFrom, forkJoin } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmpresaContextoService } from
  '@/app/core/empresa-contexto.service';

import { AuthService } from
  '@/app/domains/auth/services/auth.services';

import { AUTH_ROLES } from
  '@/app/domains/auth/constants/auth.roles';

import { CategoriasTicketService } from
  '../../../categorias-ticket/services/categorias-ticket.service';

import { CategoriaTicketList } from
  '../../../categorias-ticket/types/categoria-ticket.types';

import { mensajeApi } from '../../../shared/api-error';

import { TicketsService } from
  '../../services/tickets.service';

import {
  TicketList,
  TicketCatalogo,
  TicketPaginado,
} from '../../types/ticket.types';

@Component({
  selector: 'app-tickets-list',
  templateUrl: './tickets-list.html',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
})
export default class TicketsList {

  protected readonly empresa =
    inject(EmpresaContextoService);

  private readonly service = inject(TicketsService);

  private readonly categoriasService =
    inject(CategoriasTicketService);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // ==========================================
  // DATOS
  // ==========================================

  protected readonly items =
    signal<TicketList[]>([]);

  protected readonly estados =
    signal<TicketCatalogo[]>([]);

  protected readonly prioridades =
    signal<TicketCatalogo[]>([]);

  protected readonly categorias =
    signal<CategoriaTicketList[]>([]);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // ==========================================
  // FILTROS
  // ==========================================

  protected readonly texto = signal('');
  protected readonly buscarTexto = signal('');

  protected readonly estadoId =
    signal<number | null>(null);

  protected readonly prioridadId =
    signal<number | null>(null);

  protected readonly categoriaId =
    signal<string | null>(null);

  protected readonly fechaInicio = signal('');
  protected readonly fechaFin = signal('');

  // ==========================================
  // PAGINACION
  // ==========================================

  protected readonly pagina = signal(1);

  protected readonly tamanoPagina = 20;

  protected readonly totalRegistros = signal(0);

  protected readonly totalPaginas = signal(1);

  // ==========================================
  // PERMISOS
  // ==========================================

  protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
      AUTH_ROLES.OPERADOR,
    ])
  );

  private solicitud = 0;

  // ==========================================
  // INICIALIZACION
  // ==========================================

  constructor() {

    effect((onCleanup) => {

      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      const req = ++this.solicitud;

      this.items.set([]);
      this.estados.set([]);
      this.prioridades.set([]);
      this.categorias.set([]);

      this.pagina.set(1);
      this.totalRegistros.set(0);
      this.totalPaginas.set(1);

      this.error.set(null);
      this.loading.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const sub = forkJoin({

        tickets: this.service.getAll({
          pagina: 1,
          tamanoPagina: this.tamanoPagina,
        }),

        estados: this.service.getEstados(),

        prioridades: this.service.getPrioridades(),

        categorias: this.categoriasService.getAll(),

      }).subscribe({

        next: datos => {

          if (
            req !== this.solicitud ||
            this.empresa.empresaId !== empresaId
          ) {
            return;
          }

          this.colocarPagina(datos.tickets);

          this.estados.set(datos.estados);
          this.prioridades.set(datos.prioridades);
          this.categorias.set(datos.categorias);

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
              'No fue posible cargar los tickets.'
            )
          );

          this.loading.set(false);
        },

      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  // ==========================================
  // FILTROS
  // ==========================================

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

  protected cambiarEstado(
    valor: number | null
  ): void {

    this.estadoId.set(valor);

    this.pagina.set(1);

    void this.recargar();
  }

  protected cambiarPrioridad(
    valor: number | null
  ): void {

    this.prioridadId.set(valor);

    this.pagina.set(1);

    void this.recargar();
  }

  protected cambiarCategoria(
    valor: string | null
  ): void {

    this.categoriaId.set(valor);

    this.pagina.set(1);

    void this.recargar();
  }

  protected cambiarFechaInicio(event: Event): void {
    this.fechaInicio.set(
      (event.target as HTMLInputElement).value
    );
  }

  protected cambiarFechaFin(event: Event): void {
    this.fechaFin.set(
      (event.target as HTMLInputElement).value
    );
  }

  protected limpiar(): void {

    this.texto.set('');
    this.buscarTexto.set('');

    this.estadoId.set(null);
    this.prioridadId.set(null);
    this.categoriaId.set(null);

    this.fechaInicio.set('');
    this.fechaFin.set('');

    this.pagina.set(1);

    void this.recargar();
  }

  // ==========================================
  // PAGINACION
  // ==========================================

  protected cambiarPagina(valor: number): void {

    if (
      valor < 1 ||
      valor > this.totalPaginas() ||
      this.loading()
    ) {
      return;
    }

    this.pagina.set(valor);

    void this.recargar();
  }

  // ==========================================
  // NAVEGACION
  // ==========================================

  protected nuevo(): void {

    if (!this.puedeGestionar()) {
      return;
    }

    void this.router.navigate([
      '/admin/tickets/nuevo',
    ]);
  }

  protected editar(id: string): void {

    if (!this.puedeGestionar()) {
      return;
    }

    void this.router.navigate([
      '/admin/tickets',
      id,
      'editar',
    ]);
  }

  // ==========================================
  // CONSULTA
  // ==========================================

  protected detalle(id: string): void {

  void this.router.navigate([
        '/admin/tickets',
        id,
    ]);
    }

  protected async recargar(): Promise<void> {

    const empresaId = this.empresa.empresaId;

    if (!empresaId) {
      this.items.set([]);
      this.loading.set(false);
      return;
    }

    if (
      this.fechaInicio() &&
      this.fechaFin() &&
      this.fechaInicio() > this.fechaFin()
    ) {
      this.error.set(
        'La fecha inicial no puede ser mayor que la fecha final.'
      );

      return;
    }

    const req = ++this.solicitud;

    this.loading.set(true);
    this.error.set(null);

    try {

      const resultado = await firstValueFrom(
        this.service.getAll({

          buscar: this.buscarTexto() || undefined,

          estadoTicketId:
            this.estadoId() ?? undefined,

          prioridadTicketId:
            this.prioridadId() ?? undefined,

          categoriaTicketId:
            this.categoriaId() ?? undefined,

          fechaInicio:
            this.fechaInicio() || undefined,

          fechaFin:
            this.fechaFin() || undefined,

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
            'No fue posible consultar los tickets.'
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
    resultado: TicketPaginado
  ): void {

    this.items.set(resultado.items);

    this.totalRegistros.set(
      resultado.totalRegistros
    );

    this.totalPaginas.set(
      Math.max(1, resultado.totalPaginas)
    );
  }
}