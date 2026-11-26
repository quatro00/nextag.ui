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
import { ClientesService } from '../../services/clientes.service';
import { ClienteList } from '../../types/cliente.types';

@Component({
  selector: 'app-clientes-list',
  templateUrl: './clientes-list.html',
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
export default class ClientesList {

  private readonly service =
    inject(ClientesService);

  private readonly router =
    inject(Router);

  private readonly auth =
    inject(AuthService);

  protected readonly empresaContexto =
    inject(EmpresaContextoService);

  protected readonly clientes =
    signal<ClienteList[]>([]);

  protected readonly loading =
    signal(false);

  protected readonly actualizandoId =
    signal<string | null>(null);

  protected readonly errorMessage =
    signal<string | null>(null);

  protected readonly successMessage =
    signal<string | null>(null);

  protected readonly busqueda =
    signal('');

  protected readonly estatusFiltro =
    signal<'todos' | 'activos' | 'inactivos'>('todos');

  protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
    ])
  );

  protected readonly total = computed(() =>
    this.clientes().length
  );

  protected readonly activos = computed(() =>
    this.clientes()
      .filter(x => x.activo)
      .length
  );

  protected readonly inactivos = computed(() =>
    this.clientes()
      .filter(x => !x.activo)
      .length
  );

  protected readonly filtrados = computed(() => {

    const texto =
      this.busqueda().trim().toLowerCase();

    const estatus =
      this.estatusFiltro();

    return this.clientes().filter(x => {

      const coincideEstatus =
        estatus === 'todos' ||
        x.activo === (estatus === 'activos');

      const contenido = [
        x.clave,
        x.nombre,
        x.razonSocial,
        x.rfc,
        x.correo,
        x.telefono,
        x.contactoPrincipal,
        x.telefonoContacto,
        x.correoContacto,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const coincideBusqueda =
        !texto || contenido.includes(texto);

      return coincideEstatus &&
        coincideBusqueda;
    });
  });

  constructor() {

    effect(onCleanup => {

      const empresaId =
        this.empresaContexto.seleccionada()?.id ??
        null;

      this.clientes.set([]);
      this.busqueda.set('');
      this.estatusFiltro.set('todos');

      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.actualizandoId.set(null);
      this.loading.set(!!empresaId);

      if (!empresaId) {
        return;
      }

      const sub = this.service
        .getAll()
        .subscribe({

          next: datos => {

            if (
              this.empresaContexto.empresaId !==
              empresaId
            ) {
              return;
            }

            this.clientes.set(datos);
            this.loading.set(false);
          },

          error: (error: unknown) => {

            if (
              this.empresaContexto.empresaId !==
              empresaId
            ) {
              return;
            }

            this.errorMessage.set(
              this.mensajeError(
                error,
                'No fue posible cargar los clientes.'
              )
            );

            this.loading.set(false);
          },
        });

      onCleanup(() => sub.unsubscribe());
    });
  }

  protected cambiarBusqueda(
    event: Event
  ): void {

    this.busqueda.set(
      (event.target as HTMLInputElement).value
    );
  }

  protected cambiarEstatusFiltro(
    valor: 'todos' | 'activos' | 'inactivos'
  ): void {

    this.estatusFiltro.set(valor);
  }

  protected limpiarFiltros(): void {

    this.busqueda.set('');
    this.estatusFiltro.set('todos');
  }

  protected nuevo(): void {

    if (
      !this.puedeGestionar() ||
      !this.empresaContexto.empresaId
    ) {
      return;
    }

    void this.router.navigate([
      '/admin/clientes/nuevo',
    ]);
  }

  protected verDetalle(
    id: string
  ): void {

    if (!this.empresaContexto.empresaId) {
      return;
    }

    void this.router.navigate([
      '/admin/clientes',
      id,
    ]);
  }

  protected async cambiarEstatus(
    cliente: ClienteList
  ): Promise<void> {

    if (
      !this.puedeGestionar() ||
      this.actualizandoId() !== null
    ) {
      return;
    }

    const empresaId =
      this.empresaContexto.empresaId;

    if (!empresaId) {
      return;
    }

    const activo = !cliente.activo;

    const mensaje = activo
      ? `¿Deseas activar al cliente "${cliente.nombre}"?`
      : `¿Deseas desactivar al cliente "${cliente.nombre}"? Sus contratos existentes se conservarán.`;

    if (!confirm(mensaje)) {
      return;
    }

    this.actualizandoId.set(cliente.id);

    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {

      const respuesta =
        await firstValueFrom(
          this.service.updateStatus(
            cliente.id,
            activo
          )
        );

      if (
        this.empresaContexto.empresaId !==
        empresaId
      ) {
        return;
      }

      this.clientes.update(items =>
        items.map(x =>
          x.id === cliente.id
            ? { ...x, activo }
            : x
        )
      );

      this.successMessage.set(
        respuesta.message ||
        (
          activo
            ? 'Cliente activado correctamente.'
            : 'Cliente desactivado correctamente.'
        )
      );

    } catch (error) {

      if (
        this.empresaContexto.empresaId ===
        empresaId
      ) {

        this.errorMessage.set(
          this.mensajeError(
            error,
            'No fue posible actualizar el estatus del cliente.'
          )
        );
      }

    } finally {

      if (
        this.empresaContexto.empresaId === empresaId &&
        this.actualizandoId() === cliente.id
      ) {
        this.actualizandoId.set(null);
      }
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