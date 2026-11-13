import { HttpErrorResponse } from '@angular/common/http';

import {
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  firstValueFrom,
  forkJoin,
} from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EtiquetaPublicaService } from
  '../../services/etiqueta-publica.service';

import { TicketPublicoService } from
  '../../services/ticket-publico.service';

import { EtiquetaPublica } from
  '../../types/etiqueta-publica.types';

import {
  CategoriaTicketPublica,
  TicketPublicoCrear,
  TicketPublicoResultado,
} from '../../types/ticket-publico.types';

@Component({
  selector: 'app-ticket-publico',
  standalone: true,
  templateUrl: './ticket-publico.html',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export default class TicketPublicoComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly fb = inject(FormBuilder);

  private readonly etiquetaService =
    inject(EtiquetaPublicaService);

  private readonly ticketService =
    inject(TicketPublicoService);

  private readonly destroyRef =
    inject(DestroyRef);

  // ==========================================
  // TOKEN
  // ==========================================

  protected readonly token =
    this.route.snapshot.paramMap.get('tokenPublico') ?? '';

  // ==========================================
  // DATOS
  // ==========================================

  protected readonly etiqueta =
    signal<EtiquetaPublica | null>(null);

  protected readonly categorias =
    signal<CategoriaTicketPublica[]>([]);

  protected readonly resultado =
    signal<TicketPublicoResultado | null>(null);

  // ==========================================
  // ESTADOS
  // ==========================================

  protected readonly cargando = signal(true);

  protected readonly guardando = signal(false);

  protected readonly error =
    signal<string | null>(null);

  protected readonly errorCarga =
    signal<string | null>(null);

  // ==========================================
  // FORMULARIO
  // ==========================================

  protected readonly form = this.fb.nonNullable.group({

    nombre: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(150),
      ],
    ],

    correo: [
      '',
      [
        Validators.email,
        Validators.maxLength(254),
      ],
    ],

    telefono: [
      '',
      [
        Validators.maxLength(30),
      ],
    ],

    categoriaTicketId: [''],

    titulo: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(200),
      ],
    ],

    descripcion: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(5000),
      ],
    ],

  });

  // ==========================================
  // INICIALIZACION
  // ==========================================

  constructor() {
    void this.cargarDatos();
  }

  // ==========================================
  // CARGAR INFORMACION
  // ==========================================

  protected async cargarDatos(): Promise<void> {

    this.cargando.set(true);

    this.errorCarga.set(null);
    this.error.set(null);

    this.etiqueta.set(null);
    this.categorias.set([]);

    if (!this.token) {

      this.errorCarga.set(
        'No se proporcionó una etiqueta válida.'
      );

      this.cargando.set(false);

      return;
    }

    try {

      // No enviamos el origen NFC/QR para no
      // duplicar la lectura registrada desde
      // la ficha pública anterior.

      const datos = await firstValueFrom(
        forkJoin({

          etiqueta:
            this.etiquetaService.consultar(this.token),

          categorias:
            this.ticketService.getCategorias(this.token),

        }).pipe(
          takeUntilDestroyed(this.destroyRef)
        )
      );

      // Comprobar que todavía está permitido
      // registrar tickets para este activo.

      if (
        datos.etiqueta.estatus !== 'ACTIVO' ||
        !datos.etiqueta.activo ||
        !datos.etiqueta.permitirTicketPublico
      ) {

        this.errorCarga.set(
          'Este equipo no permite registrar solicitudes de soporte.'
        );

        return;
      }

      this.etiqueta.set(datos.etiqueta);

      this.categorias.set(datos.categorias);

    } catch (err) {

      this.errorCarga.set(
        this.obtenerError(
          err,
          'No fue posible cargar el formulario de soporte.'
        )
      );

    } finally {

      this.cargando.set(false);
    }
  }

  // ==========================================
  // VALIDAR CONTACTO
  // ==========================================

  private validarContacto(): boolean {

    const valores = this.form.getRawValue();

    const correo = valores.correo.trim();
    const telefono = valores.telefono.trim();

    if (!correo && !telefono) {

      this.error.set(
        'Debes proporcionar un correo electrónico o teléfono de contacto.'
      );

      return false;
    }

    return true;
  }

  // ==========================================
  // REGISTRAR TICKET
  // ==========================================

  protected async guardar(): Promise<void> {

    if (
      this.guardando() ||
      this.cargando() ||
      this.resultado() ||
      !this.etiqueta()
    ) {
      return;
    }

    this.error.set(null);

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      this.error.set(
        'Revisa los campos obligatorios del formulario.'
      );

      return;
    }

    if (!this.validarContacto()) {
      return;
    }

    const valores = this.form.getRawValue();

    const dto: TicketPublicoCrear = {

      nombre: valores.nombre.trim(),

      correo:
        valores.correo.trim() || null,

      telefono:
        valores.telefono.trim() || null,

      categoriaTicketId:
        valores.categoriaTicketId || null,

      titulo:
        valores.titulo.trim(),

      descripcion:
        valores.descripcion.trim(),

    };

    // Validar nuevamente después de Trim().
    if (
      dto.nombre.length < 3 ||
      dto.titulo.length < 5 ||
      dto.descripcion.length < 10
    ) {

      this.error.set(
        'Los campos obligatorios no pueden contener únicamente espacios.'
      );

      return;
    }

    this.guardando.set(true);

    this.form.disable({
      emitEvent: false,
    });

    try {

      const respuesta = await firstValueFrom(
        this.ticketService.crear(
          this.token,
          dto
        ).pipe(
          takeUntilDestroyed(this.destroyRef)
        )
      );

      this.resultado.set(respuesta);

    } catch (err) {

      this.error.set(
        this.obtenerError(
          err,
          'No fue posible registrar tu solicitud.'
        )
      );

    } finally {

      this.guardando.set(false);

      // El formulario permanece bloqueado
      // cuando el ticket fue registrado.

      if (!this.resultado()) {

        this.form.enable({
          emitEvent: false,
        });
      }
    }
  }

  // ==========================================
  // MANEJO DE ERRORES
  // ==========================================

  private obtenerError(
    error: unknown,
    mensajeDefault: string
  ): string {

    if (error instanceof HttpErrorResponse) {

      if (error.status === 404) {

        return 'La etiqueta no está disponible o el registro de tickets está deshabilitado.';
      }

      if (error.status === 429) {

        return 'Se han realizado demasiadas solicitudes. Intenta nuevamente más tarde.';
      }

      if (error.status === 400) {

        const mensaje = error.error?.message;

        if (
          typeof mensaje === 'string' &&
          mensaje.trim()
        ) {
          return mensaje;
        }

        const errors = error.error?.errors;

        if (errors && typeof errors === 'object') {

          const mensajes = Object.values(errors)
            .flatMap(valor =>
              Array.isArray(valor) ? valor : []
            )
            .filter(
              (valor): valor is string =>
                typeof valor === 'string'
            );

          if (mensajes.length > 0) {
            return mensajes.join(' ');
          }
        }

        return 'Los datos proporcionados no son válidos.';
      }

      if (error.status === 0) {

        return 'No fue posible conectar con el servidor.';
      }
    }

    return mensajeDefault;
  }

  // ==========================================
  // NAVEGACION
  // ==========================================

  protected regresar(): void {

    void this.router.navigate([
      '/e',
      this.token,
    ]);
  }
}