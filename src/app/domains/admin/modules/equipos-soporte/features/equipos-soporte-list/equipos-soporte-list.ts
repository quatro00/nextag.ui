import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

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

import { mensajeApi } from '../../../shared/api-error';

import { EquiposSoporteService } from
  '../../services/equipos-soporte.service';

import {
  EquipoSoporteList,
  TipoEquipoSoporte,
} from '../../types/equipo-soporte.types';

@Component({
  selector: 'app-equipos-soporte-list',
  templateUrl: './equipos-soporte-list.html',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
})
export default class EquiposSoporteList {

  protected readonly empresa =
    inject(EmpresaContextoService);

  private readonly service =
    inject(EquiposSoporteService);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly items =
    signal<EquipoSoporteList[]>([]);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly texto = signal('');
  protected readonly buscarTexto = signal('');

  protected readonly activo =
    signal<boolean | null>(null);

  protected readonly tipo =
    signal<TipoEquipoSoporte | null>(null);

  protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
    ])
  );

  private solicitud = 0;

  constructor() {
    effect(() => {
      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      ++this.solicitud;

      this.items.set([]);
      this.error.set(null);

      if (empresaId) {
        void this.recargar();
      }
    });
  }

  protected cambiarTexto(event: Event): void {
    this.texto.set(
      (event.target as HTMLInputElement).value
    );
  }

  protected buscar(): void {
    this.buscarTexto.set(this.texto().trim());
    void this.recargar();
  }

  protected cambiarEstado(
    valor: boolean | null
  ): void {
    this.activo.set(valor);
    void this.recargar();
  }

  protected cambiarTipo(
    valor: TipoEquipoSoporte | null
  ): void {
    this.tipo.set(valor);
    void this.recargar();
  }

  protected limpiar(): void {
    this.texto.set('');
    this.buscarTexto.set('');
    this.activo.set(null);
    this.tipo.set(null);

    void this.recargar();
  }

  protected nuevo(): void {
    void this.router.navigate([
      '/admin/equipos-soporte/nuevo',
    ]);
  }

  protected editar(id: string): void {
    void this.router.navigate([
      '/admin/equipos-soporte',
      id,
    ]);
  }

  protected integrantes(id: string): void {
    void this.router.navigate([
      '/admin/equipos-soporte',
      id,
      'integrantes',
    ]);
  }

  protected async cambiarEstatus(
    item: EquipoSoporteList
  ): Promise<void> {

    if (!this.puedeGestionar() || this.loading()) {
      return;
    }

    const accion = item.activo
      ? 'desactivar'
      : 'activar';

    if (!window.confirm(
      `¿Deseas ${accion} el equipo "${item.nombre}"?`
    )) {
      return;
    }

    try {
      await firstValueFrom(
        this.service.updateStatus(
          item.id,
          !item.activo
        )
      );

      await this.recargar();

    } catch (err) {
      this.error.set(
        mensajeApi(
          err,
          'No fue posible actualizar el equipo.'
        )
      );
    }
  }

  protected async recargar(): Promise<void> {

    const empresaId = this.empresa.empresaId;

    if (!empresaId) {
      this.items.set([]);
      this.loading.set(false);
      return;
    }

    const req = ++this.solicitud;

    this.loading.set(true);
    this.error.set(null);

    try {
      const resultado = await firstValueFrom(
        this.service.getAll({
          activo: this.activo() ?? undefined,
          tipo: this.tipo() ?? undefined,
          buscar: this.buscarTexto() || undefined,
        })
      );

      if (
        req !== this.solicitud ||
        this.empresa.empresaId !== empresaId
      ) {
        return;
      }

      this.items.set(resultado);

    } catch (err) {
      if (
        req === this.solicitud &&
        this.empresa.empresaId === empresaId
      ) {
        this.error.set(
          mensajeApi(
            err,
            'No fue posible consultar los equipos.'
          )
        );
      }

    } finally {
      if (req === this.solicitud) {
        this.loading.set(false);
      }
    }
  }
}