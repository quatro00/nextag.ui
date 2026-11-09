import { HttpErrorResponse } from '@angular/common/http';
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
import { ResponsablesService } from '../../services/responsables.service';
import {
  Responsable,
  ResponsableFiltro,
  TipoResponsable,
} from '../../types/responsable.types';

@Component({
  selector: 'app-responsables-list',
  templateUrl: './responsables-list.html',
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
export default class ResponsablesList {

  private readonly service = inject(ResponsablesService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly empresaContexto =
    inject(EmpresaContextoService);

  protected readonly responsables =
    signal<Responsable[]>([]);

  protected readonly loading = signal(false);

  protected readonly actualizandoId =
    signal<string | null>(null);

  protected readonly errorMessage =
    signal<string | null>(null);

  protected readonly busqueda = signal('');

  protected readonly tipoFiltro =
    signal<TipoResponsable | ''>('');

  protected readonly estatusFiltro =
    signal<'todos' | 'activos' | 'inactivos'>('todos');

  protected readonly pagina = signal(1);
  protected readonly tamanoPagina = signal(20);

  protected readonly total = signal(0);
  protected readonly totalPaginas = signal(0);

  private solicitud = 0;

  protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
    ])
  );

  constructor() {
    this.loading.set(true);
    effect((onCleanup) => {

      const empresaId =
        this.empresaContexto.seleccionada()?.id ?? null;

      ++this.solicitud;

      this.responsables.set([]);
      this.total.set(0);
      this.totalPaginas.set(0);
      this.pagina.set(1);
      this.busqueda.set('');
      this.tipoFiltro.set('');
      this.estatusFiltro.set('todos');
      this.errorMessage.set(null);

      if (!empresaId) {
        this.loading.set(false);
        return;
      }

      const sub = this.service.getAll({
        pagina: 1,
        tamanoPagina: this.tamanoPagina(),
      }).subscribe({

        next: resultado => {

          if (this.empresaContexto.empresaId !== empresaId) {
            return;
          }

          this.responsables.set(resultado.items);
          this.total.set(resultado.total);
          this.totalPaginas.set(resultado.totalPaginas);
          this.loading.set(false);
        },

        error: error => {

          if (this.empresaContexto.empresaId !== empresaId) {
            return;
          }

          this.errorMessage.set(
            this.mensajeError(
              error,
              'No fue posible cargar los responsables.'
            )
          );

          this.loading.set(false);
        },
      });

      onCleanup(() => sub.unsubscribe());

    });
  }

  protected cambiarBusqueda(event: Event): void {
    this.busqueda.set(
      (event.target as HTMLInputElement).value
    );
  }

  protected cambiarTipo(
    tipo: TipoResponsable | ''
  ): void {
    this.tipoFiltro.set(tipo);
    void this.buscar();
  }

  protected cambiarEstatus(
    estatus: 'todos' | 'activos' | 'inactivos'
  ): void {
    this.estatusFiltro.set(estatus);
    void this.buscar();
  }

  protected async buscar(): Promise<void> {
    this.pagina.set(1);
    await this.cargar();
  }

  protected async cambiarPagina(
    nuevaPagina: number
  ): Promise<void> {

    if (
      nuevaPagina < 1 ||
      nuevaPagina > this.totalPaginas()
    ) {
      return;
    }

    this.pagina.set(nuevaPagina);

    await this.cargar();
  }

  private async cargar(): Promise<void> {

    const empresaId = this.empresaContexto.empresaId;

    if (!empresaId) {
      return;
    }

    const solicitudActual = ++this.solicitud;

    const filtros: ResponsableFiltro = {
      buscar: this.busqueda(),
      tipo: this.tipoFiltro() || undefined,

      activo:
        this.estatusFiltro() === 'todos'
          ? undefined
          : this.estatusFiltro() === 'activos',

      pagina: this.pagina(),
      tamanoPagina: this.tamanoPagina(),
    };

    this.loading.set(true);
    this.errorMessage.set(null);

    try {

      const resultado = await firstValueFrom(
        this.service.getAll(filtros)
      );

      if (
        this.empresaContexto.empresaId !== empresaId ||
        solicitudActual !== this.solicitud
      ) {
        return;
      }

      this.responsables.set(resultado.items);
      this.total.set(resultado.total);
      this.totalPaginas.set(resultado.totalPaginas);

    } catch (error) {

      if (
        this.empresaContexto.empresaId === empresaId &&
        solicitudActual === this.solicitud
      ) {

        this.errorMessage.set(
          this.mensajeError(
            error,
            'No fue posible cargar los responsables.'
          )
        );
      }

    } finally {

      if (solicitudActual === this.solicitud) {
        this.loading.set(false);
      }
    }
  }

  protected nuevo(): void {

    if (
      !this.puedeGestionar() ||
      !this.empresaContexto.empresaId
    ) {
      return;
    }

    void this.router.navigate([
      '/admin/responsables/nuevo',
    ]);
  }

  protected verDetalle(id: string): void {

    void this.router.navigate([
      '/admin/responsables',
      id,
    ]);
  }

  protected async actualizarEstatus(
    responsable: Responsable
  ): Promise<void> {

    if (
      !this.puedeGestionar() ||
      this.actualizandoId()
    ) {
      return;
    }

    const empresaId = this.empresaContexto.empresaId;

    if (!empresaId) {
      return;
    }

    const activo = !responsable.activo;

    const accion = activo
      ? 'activar'
      : 'desactivar';

    if (
      !confirm(
        `¿Deseas ${accion} a "${responsable.nombre}"?`
      )
    ) {
      return;
    }

    this.actualizandoId.set(responsable.id);
    this.errorMessage.set(null);

    try {

      await firstValueFrom(
        this.service.updateStatus(
          responsable.id,
          activo
        )
      );

      if (this.empresaContexto.empresaId === empresaId) {
        await this.cargar();
      }

    } catch (error) {

      if (this.empresaContexto.empresaId === empresaId) {

        this.errorMessage.set(
          this.mensajeError(
            error,
            'No fue posible cambiar el estatus.'
          )
        );
      }

    } finally {

      this.actualizandoId.set(null);
    }
  }

  private mensajeError(
    error: unknown,
    fallback: string
  ): string {

    if (
      error instanceof HttpErrorResponse &&
      typeof error.error?.message === 'string'
    ) {
      return error.error.message;
    }

    return fallback;
  }
}