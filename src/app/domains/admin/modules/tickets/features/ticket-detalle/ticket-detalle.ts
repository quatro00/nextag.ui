import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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

import { mensajeApi } from '../../../shared/api-error';

import { TicketsService } from
  '../../services/tickets.service';

import { TicketOperacionService } from
  '../../services/ticket-operacion.service';

import { EquiposSoporteService } from
  '../../../equipos-soporte/services/equipos-soporte.service';

import { EquipoSoporteIntegrantesService } from
  '../../../equipos-soporte/services/equipo-soporte-integrantes.service';

import { EquipoSoporteList } from
  '../../../equipos-soporte/types/equipo-soporte.types';

import { UsuarioDisponibleSoporte } from
  '../../../equipos-soporte/types/equipo-soporte-integrante.types';

import {
  TicketDetalle,
  TicketCatalogo,
} from '../../types/ticket.types';

import {
  TicketAsignacion,
  TicketEstadoHistorial,
  TicketSeguimiento,
} from '../../types/ticket-operacion.types';

type AccionTicket =
  | 'RESOLVER'
  | 'REABRIR'
  | 'CANCELAR';

@Component({
  selector: 'app-ticket-detalle',
  templateUrl: './ticket-detalle.html',
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
export default class TicketDetalleComponent {

  protected readonly empresa =
    inject(EmpresaContextoService);

  private readonly service =
    inject(TicketsService);

  private readonly operacion =
    inject(TicketOperacionService);

  private readonly equiposService =
    inject(EquiposSoporteService);

  private readonly integrantesService =
    inject(EquipoSoporteIntegrantesService);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly id =
    this.route.snapshot.paramMap.get('id') ?? '';

  // ==========================================
  // DATOS
  // ==========================================

  protected readonly ticket =
    signal<TicketDetalle | null>(null);

  protected readonly estados =
    signal<TicketCatalogo[]>([]);

  protected readonly asignacion =
    signal<TicketAsignacion | null>(null);

  protected readonly historialEstados =
    signal<TicketEstadoHistorial[]>([]);

  protected readonly historialAsignaciones =
    signal<TicketAsignacion[]>([]);

  protected readonly seguimientos =
    signal<TicketSeguimiento[]>([]);

  protected readonly equipos =
    signal<EquipoSoporteList[]>([]);

  protected readonly tecnicos =
    signal<UsuarioDisponibleSoporte[]>([]);

  protected readonly loading = signal(false);
  protected readonly guardando = signal(false);

  protected readonly error =
    signal<string | null>(null);

  protected readonly mensaje =
    signal<string | null>(null);

  // ==========================================
  // FORMULARIO ASIGNACION
  // ==========================================

  protected readonly equipoId = signal('');
  protected readonly tecnicoId = signal('');
  protected readonly motivoAsignacion = signal('');

  protected readonly mostrarAsignacion = signal(false);

  // ==========================================
  // FORMULARIO ACCIONES
  // ==========================================

  protected readonly accion =
    signal<AccionTicket | null>(null);

  protected readonly textoAccion = signal('');

  // ==========================================
  // SEGUIMIENTO
  // ==========================================

  protected readonly tipoComentario =
    signal<'COMENTARIO' | 'NOTA_INTERNA'>('COMENTARIO');

  protected readonly comentario = signal('');

  // ==========================================
  // PERMISOS
  // ==========================================

  protected readonly esAdministrador = computed(() =>
    this.auth.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
    ])
  );

  protected readonly puedeOperar = computed(() =>
    this.auth.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
      AUTH_ROLES.OPERADOR,
    ])
  );

  protected readonly estadoClave = computed(() => {
    const id = this.ticket()?.estadoTicketId;

    return this.estados().find(
      x => x.id === id
    )?.clave ?? '';
  });

  protected readonly puedeIniciar = computed(() =>
    this.puedeOperar() &&
    ['ASIGNADO', 'REABIERTO'].includes(this.estadoClave())
  );

  protected readonly puedeResolver = computed(() =>
    this.puedeOperar() &&
    this.estadoClave() === 'EN_PROCESO'
  );

  protected readonly puedeCerrar = computed(() =>
    this.esAdministrador() &&
    this.estadoClave() === 'RESUELTO'
  );

  protected readonly puedeReabrir = computed(() =>
    this.esAdministrador() &&
    ['RESUELTO', 'CERRADO'].includes(this.estadoClave())
  );

  protected readonly puedeCancelar = computed(() =>
    this.esAdministrador() &&
    ['ABIERTO', 'ASIGNADO', 'EN_PROCESO', 'REABIERTO']
      .includes(this.estadoClave())
  );

  protected readonly puedeComentar = computed(() =>
    this.puedeOperar() &&
    !['CERRADO', 'CANCELADO'].includes(this.estadoClave())
  );

  protected readonly puedeAsignar = computed(() =>
    this.esAdministrador() &&
    ['ABIERTO', 'ASIGNADO', 'EN_PROCESO', 'REABIERTO']
      .includes(this.estadoClave())
  );

  private solicitud = 0;
  private solicitudTecnicos = 0;

  // ==========================================
  // INICIALIZACION
  // ==========================================

  constructor() {

    effect((onCleanup) => {

      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      const req = ++this.solicitud;

      ++this.solicitudTecnicos;

      this.ticket.set(null);
      this.asignacion.set(null);

      this.historialEstados.set([]);
      this.historialAsignaciones.set([]);
      this.seguimientos.set([]);

      this.estados.set([]);
      this.equipos.set([]);
      this.tecnicos.set([]);

      this.mostrarAsignacion.set(false);
      this.accion.set(null);

      this.error.set(null);
      this.mensaje.set(null);

      this.loading.set(!!empresaId);

      if (!empresaId || !this.id) {
        return;
      }

      const sub = forkJoin({

        ticket: this.service.getById(this.id),

        estados: this.service.getEstados(),

        asignacion:
          this.operacion.getAsignacionVigente(this.id),

        historialEstados:
          this.operacion.getHistorialEstados(this.id),

        historialAsignaciones:
          this.operacion.getHistorialAsignaciones(this.id),

        seguimientos:
          this.operacion.getSeguimientos(this.id),

        equipos:
          this.equiposService.getAll(),

      }).subscribe({

        next: datos => {

          if (
            req !== this.solicitud ||
            this.empresa.empresaId !== empresaId
          ) {
            return;
          }

          this.ticket.set(datos.ticket);
          this.estados.set(datos.estados);

          this.asignacion.set(datos.asignacion);

          this.historialEstados.set(datos.historialEstados);

          this.historialAsignaciones.set(
            datos.historialAsignaciones
          );

          this.seguimientos.set(datos.seguimientos);

          this.equipos.set(datos.equipos);

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
              'No fue posible cargar el detalle del ticket.'
            )
          );

          this.loading.set(false);
        },

      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  // ==========================================
  // RECARGAR
  // ==========================================

  protected async recargar(): Promise<void> {

    const empresaId = this.empresa.empresaId;

    if (!empresaId) return;

    const req = ++this.solicitud;

    try {

      const datos = await firstValueFrom(
        forkJoin({

          ticket: this.service.getById(this.id),

          asignacion:
            this.operacion.getAsignacionVigente(this.id),

          historialEstados:
            this.operacion.getHistorialEstados(this.id),

          historialAsignaciones:
            this.operacion.getHistorialAsignaciones(this.id),

          seguimientos:
            this.operacion.getSeguimientos(this.id),

        })
      );

      if (
        req !== this.solicitud ||
        this.empresa.empresaId !== empresaId
      ) return;

      this.ticket.set(datos.ticket);

      this.asignacion.set(datos.asignacion);

      this.historialEstados.set(datos.historialEstados);

      this.historialAsignaciones.set(
        datos.historialAsignaciones
      );

      this.seguimientos.set(datos.seguimientos);

    } catch (err) {

      if (this.empresa.empresaId === empresaId) {
        this.error.set(
          mensajeApi(err, 'No fue posible actualizar el ticket.')
        );
      }
    }
  }

  // ==========================================
  // ASIGNACIONES
  // ==========================================

  protected async abrirAsignacion(): Promise<void> {

    if (!this.puedeAsignar()) return;

    const vigente = this.asignacion();

    this.equipoId.set(vigente?.equipoSoporteId ?? '');
    this.tecnicoId.set(vigente?.usuarioTecnicoId ?? '');

    this.motivoAsignacion.set('');

    this.mostrarAsignacion.set(true);

    if (vigente?.equipoSoporteId) {
      await this.cargarTecnicos(vigente.equipoSoporteId);
    }
  }

  protected async cambiarEquipo(
    id: string
  ): Promise<void> {

    this.equipoId.set(id);
    this.tecnicoId.set('');

    this.tecnicos.set([]);

    if (id) {
      await this.cargarTecnicos(id);
    }
  }

  private async cargarTecnicos(
    equipoId: string
  ): Promise<void> {

    const empresaId = this.empresa.empresaId;

    if (!empresaId) return;

    const req = ++this.solicitudTecnicos;

    try {

      /*
       * El endpoint "disponibles" está diseñado
       * para agregar integrantes al equipo.
       *
       * Para seleccionar técnicos de un ticket,
       * consultamos los integrantes activos
       * del equipo existente.
       */

      const integrantes = await firstValueFrom(
        this.integrantesService.getAll(
          equipoId,
          true
        )
      );

      if (
        req !== this.solicitudTecnicos ||
        this.empresa.empresaId !== empresaId ||
        this.equipoId() !== equipoId
      ) return;

      this.tecnicos.set(
        integrantes.map(x => ({
          id: x.usuarioId,
          nombre: x.usuarioNombre,
          apellidos: '',
          nombreCompleto: x.usuarioNombre,
          correo: x.usuarioCorreo,
        }))
      );

    } catch (err) {

      this.error.set(
        mensajeApi(err, 'No fue posible consultar los técnicos.')
      );
    }
  }

  protected seleccionarTecnico(
    id: string
  ): void {
    this.tecnicoId.set(id);
  }

  protected cambiarMotivoAsignacion(
    event: Event
  ): void {
    this.motivoAsignacion.set(
      (event.target as HTMLTextAreaElement).value
    );
  }

  protected async guardarAsignacion(): Promise<void> {

    if (
      !this.puedeAsignar() ||
      this.guardando() ||
      !this.equipoId()
    ) return;

    const vigente = this.asignacion();

    const motivo = this.motivoAsignacion().trim();

    if (vigente && motivo.length < 5) {
      this.error.set(
        'Indica un motivo de reasignación de al menos 5 caracteres.'
      );
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    try {

      if (vigente) {

        await firstValueFrom(
          this.operacion.reasignar(this.id, {
            equipoSoporteId: this.equipoId(),
            usuarioTecnicoId: this.tecnicoId() || null,
            motivo,
          })
        );

      } else {

        await firstValueFrom(
          this.operacion.asignar(this.id, {
            equipoSoporteId: this.equipoId(),
            usuarioTecnicoId: this.tecnicoId() || null,
            motivo: motivo || null,
          })
        );
      }

      this.mostrarAsignacion.set(false);

      await this.recargar();

      this.mensaje.set(
        vigente
          ? 'Ticket reasignado correctamente.'
          : 'Ticket asignado correctamente.'
      );

    } catch (err) {

      this.error.set(
        mensajeApi(err, 'No fue posible asignar el ticket.')
      );

    } finally {
      this.guardando.set(false);
    }
  }

  // ==========================================
  // INICIAR ATENCION
  // ==========================================

  protected async iniciar(): Promise<void> {

    if (!this.puedeIniciar() || this.guardando()) {
      return;
    }

    if (!window.confirm(
      '¿Deseas iniciar la atención de este ticket?'
    )) return;

    this.guardando.set(true);
    this.error.set(null);

    try {

      await firstValueFrom(
        this.operacion.iniciar(this.id)
      );

      await this.recargar();

      this.mensaje.set('Atención iniciada correctamente.');

    } catch (err) {

      this.error.set(
        mensajeApi(err, 'No fue posible iniciar la atención.')
      );

    } finally {
      this.guardando.set(false);
    }
  }

  // ==========================================
  // ACCIONES
  // ==========================================

  protected abrirAccion(
    accion: AccionTicket
  ): void {

    this.accion.set(accion);
    this.textoAccion.set('');
  }

  protected cambiarTextoAccion(event: Event): void {

    this.textoAccion.set(
      (event.target as HTMLTextAreaElement).value
    );
  }

  protected cancelarAccion(): void {

    this.accion.set(null);
    this.textoAccion.set('');
  }

  protected async ejecutarAccion(): Promise<void> {

    const accion = this.accion();
    const texto = this.textoAccion().trim();

    if (!accion || this.guardando()) return;

    if (texto.length < 5) {
      this.error.set(
        'Debes escribir al menos 5 caracteres.'
      );
      return;
    }

    if (
      (accion === 'RESOLVER' && !this.puedeResolver()) ||
      (accion === 'REABRIR' && !this.puedeReabrir()) ||
      (accion === 'CANCELAR' && !this.puedeCancelar())
    ) return;

    this.guardando.set(true);
    this.error.set(null);

    try {

      switch (accion) {

        case 'RESOLVER':

          await firstValueFrom(
            this.operacion.resolver(this.id, texto)
          );

          break;

        case 'REABRIR':

          await firstValueFrom(
            this.operacion.reabrir(this.id, texto)
          );

          break;

        case 'CANCELAR':

          await firstValueFrom(
            this.operacion.cancelar(this.id, texto)
          );

          break;
      }

      this.cancelarAccion();

      await this.recargar();

      this.mensaje.set(
        'Operación realizada correctamente.'
      );

    } catch (err) {

      this.error.set(
        mensajeApi(err, 'No fue posible realizar la operación.')
      );

    } finally {
      this.guardando.set(false);
    }
  }

  // ==========================================
  // CERRAR TICKET
  // ==========================================

  protected async cerrar(): Promise<void> {

    if (!this.puedeCerrar() || this.guardando()) {
      return;
    }

    if (!window.confirm(
      '¿Deseas cerrar definitivamente este ticket?'
    )) return;

    this.guardando.set(true);
    this.error.set(null);

    try {

      await firstValueFrom(
        this.operacion.cerrar(this.id)
      );

      await this.recargar();

      this.mensaje.set('Ticket cerrado correctamente.');

    } catch (err) {

      this.error.set(
        mensajeApi(err, 'No fue posible cerrar el ticket.')
      );

    } finally {
      this.guardando.set(false);
    }
  }

  // ==========================================
  // COMENTARIOS
  // ==========================================

  protected cambiarTipoComentario(
    tipo: 'COMENTARIO' | 'NOTA_INTERNA'
  ): void {

    this.tipoComentario.set(tipo);
  }

  protected cambiarComentario(
    event: Event
  ): void {

    this.comentario.set(
      (event.target as HTMLTextAreaElement).value
    );
  }

  protected async guardarComentario(): Promise<void> {

    if (
      !this.puedeComentar() ||
      this.guardando()
    ) return;

    const texto = this.comentario().trim();

    if (texto.length < 3 || texto.length > 10000) {

      this.error.set(
        'El comentario debe contener entre 3 y 10000 caracteres.'
      );

      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    try {

      if (this.tipoComentario() === 'COMENTARIO') {

        await firstValueFrom(
          this.operacion.agregarComentario(this.id, texto)
        );

      } else {

        await firstValueFrom(
          this.operacion.agregarNotaInterna(this.id, texto)
        );
      }

      this.comentario.set('');

      await this.recargar();

      this.mensaje.set(
        'Seguimiento registrado correctamente.'
      );

    } catch (err) {

      this.error.set(
        mensajeApi(err, 'No fue posible registrar el seguimiento.')
      );

    } finally {
      this.guardando.set(false);
    }
  }

  // ==========================================
  // NAVEGACION
  // ==========================================

  protected editar(): void {

    void this.router.navigate([
      '/admin/tickets',
      this.id,
      'editar',
    ]);
  }

  protected regresar(): void {

    void this.router.navigate([
      '/admin/tickets',
    ]);
  }
}