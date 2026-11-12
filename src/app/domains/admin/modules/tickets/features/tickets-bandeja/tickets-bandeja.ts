import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import { firstValueFrom } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmpresaContextoService } from
  '@/app/core/empresa-contexto.service';

import { mensajeApi } from '../../../shared/api-error';

import { TicketOperacionService } from
  '../../services/ticket-operacion.service';

import { TicketList } from
  '../../types/ticket.types';

type TipoBandeja =
  | 'MIS_TICKETS'
  | 'MIS_EQUIPOS';

@Component({
  selector: 'app-tickets-bandeja',
  templateUrl: './tickets-bandeja.html',
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
export default class TicketsBandeja {

  protected readonly empresa =
    inject(EmpresaContextoService);

  private readonly operacion =
    inject(TicketOperacionService);

  private readonly router =
    inject(Router);

  private readonly route =
    inject(ActivatedRoute);

  // ==========================================
  // TIPO DE BANDEJA
  // ==========================================

  protected readonly tipoBandeja: TipoBandeja =
    this.route.snapshot.data['bandeja'] === 'MIS_EQUIPOS'
      ? 'MIS_EQUIPOS'
      : 'MIS_TICKETS';

  protected readonly titulo = computed(() =>
    this.tipoBandeja === 'MIS_TICKETS'
      ? 'Mis tickets'
      : 'Tickets de mis equipos'
  );

  protected readonly descripcion = computed(() =>
    this.tipoBandeja === 'MIS_TICKETS'
      ? 'Consulta las solicitudes asignadas directamente a ti.'
      : 'Consulta las solicitudes asignadas a los equipos de soporte a los que perteneces.'
  );

  // ==========================================
  // DATOS
  // ==========================================

  protected readonly items =
    signal<TicketList[]>([]);

  protected readonly loading =
    signal(false);

  protected readonly error =
    signal<string | null>(null);

  // ==========================================
  // FILTROS
  // ==========================================

  protected readonly texto =
    signal('');

  protected readonly buscarTexto =
    signal('');

  protected readonly estado =
    signal<string | null>(null);

  protected readonly prioridad =
    signal<string | null>(null);

  // ==========================================
  // PAGINACION LOCAL
  // ==========================================

  protected readonly pagina =
    signal(1);

  protected readonly tamanoPagina = 20;

  // ==========================================
  // CATALOGOS DERIVADOS
  // ==========================================

  protected readonly estados = computed(() => {

    const nombres = this.items()
      .map(x => x.estadoNombre)
      .filter(x => !!x);

    return [...new Set(nombres)].sort();
  });

  protected readonly prioridades = computed(() => {

    const nombres = this.items()
      .map(x => x.prioridadNombre)
      .filter(x => !!x);

    return [...new Set(nombres)].sort();
  });

  // ==========================================
  // FILTRADO
  // ==========================================

  protected readonly filtrados = computed(() => {

    const buscar = this.buscarTexto()
      .trim()
      .toLocaleLowerCase();

    const estado = this.estado();
    const prioridad = this.prioridad();

    return this.items().filter(item => {

      // BUSQUEDA GENERAL

      if (buscar) {

        const texto = [
          item.folio,
          item.titulo,
          item.activoNombre,
          item.activoCodigo,
          item.categoriaNombre,
          item.solicitanteNombre,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase();

        if (!texto.includes(buscar)) {
          return false;
        }
      }

      // ESTADO

      if (
        estado &&
        item.estadoNombre !== estado
      ) {
        return false;
      }

      // PRIORIDAD

      if (
        prioridad &&
        item.prioridadNombre !== prioridad
      ) {
        return false;
      }

      return true;
    });
  });

  // ==========================================
  // INDICADORES
  // ==========================================

  protected readonly totalTickets = computed(() =>
    this.items().length
  );

  protected readonly totalFiltrados = computed(() =>
    this.filtrados().length
  );

  protected readonly totalPaginas = computed(() =>
    Math.max(
      1,
      Math.ceil(
        this.totalFiltrados() / this.tamanoPagina
      )
    )
  );

  protected readonly ticketsPagina = computed(() => {

    const inicio =
      (this.pagina() - 1) * this.tamanoPagina;

    return this.filtrados().slice(
      inicio,
      inicio + this.tamanoPagina
    );
  });

  // ==========================================
  // CONTROL DE PETICIONES
  // ==========================================

  private solicitud = 0;

  constructor() {

    effect(() => {

      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      ++this.solicitud;

      this.items.set([]);
      this.error.set(null);
      this.loading.set(false);

      this.pagina.set(1);

      this.texto.set('');
      this.buscarTexto.set('');
      this.estado.set(null);
      this.prioridad.set(null);

      if (empresaId) {
        void this.recargar();
      }
    });
  }

  // ==========================================
  // CONSULTAR BANDEJA
  // ==========================================

  protected async recargar(): Promise<void> {

    const empresaId =
      this.empresa.empresaId;

    if (!empresaId) {

      this.items.set([]);
      this.loading.set(false);

      return;
    }

    const req = ++this.solicitud;

    this.loading.set(true);
    this.error.set(null);

    try {

      const consulta =
        this.tipoBandeja === 'MIS_TICKETS'
          ? this.operacion.getMisTickets()
          : this.operacion.getTicketsMisEquipos();

      const resultado = await firstValueFrom(
        consulta
      );

      if (
        req !== this.solicitud ||
        this.empresa.empresaId !== empresaId
      ) {
        return;
      }

      this.items.set(resultado);

      this.pagina.set(1);

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

  // ==========================================
  // FILTROS
  // ==========================================

  protected cambiarTexto(event: Event): void {

    this.texto.set(
      (event.target as HTMLInputElement).value
    );
  }

  protected buscar(): void {

    this.buscarTexto.set(
      this.texto().trim()
    );

    this.pagina.set(1);
  }

  protected cambiarEstado(
    valor: string | null
  ): void {

    this.estado.set(valor);

    this.pagina.set(1);
  }

  protected cambiarPrioridad(
    valor: string | null
  ): void {

    this.prioridad.set(valor);

    this.pagina.set(1);
  }

  protected limpiar(): void {

    this.texto.set('');
    this.buscarTexto.set('');

    this.estado.set(null);
    this.prioridad.set(null);

    this.pagina.set(1);
  }

  // ==========================================
  // PAGINACION
  // ==========================================

  protected cambiarPagina(
    valor: number
  ): void {

    if (
      valor < 1 ||
      valor > this.totalPaginas() ||
      this.loading()
    ) {
      return;
    }

    this.pagina.set(valor);
  }

  // ==========================================
  // NAVEGACION
  // ==========================================

  protected detalle(id: string): void {

    void this.router.navigate([
      '/admin/tickets',
      id,
    ]);
  }

  protected irMisTickets(): void {

    void this.router.navigate([
      '/admin/tickets/mis-tickets',
    ]);
  }

  protected irMisEquipos(): void {

    void this.router.navigate([
      '/admin/tickets/mis-equipos',
    ]);
  }

  protected irTodos(): void {

    void this.router.navigate([
      '/admin/tickets',
    ]);
  }
}