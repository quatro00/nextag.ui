import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmpresaContextoService } from
  '@/app/core/empresa-contexto.service';

import { AuthService } from
  '@/app/domains/auth/services/auth.services';

import { AUTH_ROLES } from
  '@/app/domains/auth/constants/auth.roles';

import { mensajeApi } from '../../../shared/api-error';

import { EquipoSoporteIntegrantesService } from
  '../../services/equipo-soporte-integrantes.service';

import { EquiposSoporteService } from
  '../../services/equipos-soporte.service';

import {
  EquipoSoporteIntegrante,
  UsuarioDisponibleSoporte,
} from '../../types/equipo-soporte-integrante.types';

@Component({
  selector: 'app-equipo-soporte-integrantes',
  templateUrl: './equipo-soporte-integrantes.html',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
})
export default class EquipoSoporteIntegrantes {

  protected readonly empresa =
    inject(EmpresaContextoService);

  private readonly service =
    inject(EquipoSoporteIntegrantesService);

  private readonly equiposService =
    inject(EquiposSoporteService);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly equipoId =
    this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly nombreEquipo = signal('');

  protected readonly integrantes =
    signal<EquipoSoporteIntegrante[]>([]);

  protected readonly disponibles =
    signal<UsuarioDisponibleSoporte[]>([]);

  protected readonly usuarioSeleccionado = signal('');

  protected readonly loading = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

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

      this.integrantes.set([]);
      this.disponibles.set([]);
      this.usuarioSeleccionado.set('');
      this.nombreEquipo.set('');

      if (empresaId && this.equipoId) {
        void this.cargar();
      }
    });
  }

  protected async cargar(): Promise<void> {

    const empresaId = this.empresa.empresaId;
    if (!empresaId) return;

    const req = ++this.solicitud;

    this.loading.set(true);
    this.error.set(null);

    try {
      const [equipo, integrantes, disponibles] =
        await Promise.all([
          firstValueFrom(
            this.equiposService.getById(this.equipoId)
          ),
          firstValueFrom(
            this.service.getAll(this.equipoId)
          ),
          firstValueFrom(
            this.service.getDisponibles(this.equipoId)
          ),
        ]);

      if (
        req !== this.solicitud ||
        this.empresa.empresaId !== empresaId
      ) return;

      this.nombreEquipo.set(equipo.nombre);
      this.integrantes.set(integrantes);
      this.disponibles.set(disponibles);

    } catch (err) {
      if (req === this.solicitud) {
        this.error.set(
          mensajeApi(err, 'No fue posible cargar los integrantes.')
        );
      }
    } finally {
      if (req === this.solicitud) {
        this.loading.set(false);
      }
    }
  }

  protected seleccionarUsuario(id: string): void {
    this.usuarioSeleccionado.set(id);
  }

  protected async agregar(): Promise<void> {

    if (
      !this.puedeGestionar() ||
      !this.usuarioSeleccionado() ||
      this.guardando()
    ) return;

    this.guardando.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.service.create(this.equipoId, {
          usuarioId: this.usuarioSeleccionado(),
        })
      );

      this.usuarioSeleccionado.set('');

      await this.cargar();

    } catch (err) {
      this.error.set(
        mensajeApi(err, 'No fue posible agregar el integrante.')
      );
    } finally {
      this.guardando.set(false);
    }
  }

  protected async cambiarEstatus(
    item: EquipoSoporteIntegrante
  ): Promise<void> {

    if (!this.puedeGestionar()) return;

    const accion = item.activo
      ? 'desactivar'
      : 'activar';

    if (!window.confirm(
      `¿Deseas ${accion} al integrante "${item.usuarioNombre}"?`
    )) return;

    try {
      await firstValueFrom(
        this.service.updateStatus(
          this.equipoId,
          item.id,
          !item.activo
        )
      );

      await this.cargar();

    } catch (err) {
      this.error.set(
        mensajeApi(err, 'No fue posible cambiar el estado del integrante.')
      );
    }
  }

  protected regresar(): void {
    void this.router.navigate([
      '/admin/equipos-soporte',
    ]);
  }
}