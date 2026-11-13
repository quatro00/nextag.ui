import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { firstValueFrom } from 'rxjs';

import {
  EmpresaContextoService
} from '@/app/core/empresa-contexto.service';

import {
  AUTH_ROLES
} from '@/app/domains/auth/constants/auth.roles';

import {
  AuthService
} from '@/app/domains/auth/services/auth.services';

import {
  mensajeApi
} from '../../../shared/api-error';

import {
  EtiquetaConfiguracionService
} from '../../services/etiqueta-configuracion.service';

import {
  EtiquetaConfiguracion,
  EtiquetaConfiguracionGuardar,
} from '../../types/etiqueta-configuracion.types';

@Component({
  selector: 'app-etiqueta-configuracion',
  standalone: true,
  templateUrl: './etiqueta-configuracion.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
})
export default class EtiquetaConfiguracionComponent {

  protected readonly empresa =
    inject(EmpresaContextoService);

  private readonly auth =
    inject(AuthService);

  private readonly service =
    inject(EtiquetaConfiguracionService);

  private readonly router =
    inject(Router);

  private readonly fb =
    inject(FormBuilder);

  private solicitud = 0;

  private configuracionOriginal:
    EtiquetaConfiguracionGuardar | null = null;

  // ==========================================
  // ESTADOS
  // ==========================================

  protected readonly cargando = signal(false);

  protected readonly guardando = signal(false);

  protected readonly error =
    signal<string | null>(null);

  protected readonly exito =
    signal<string | null>(null);

  protected readonly configuracion =
    signal<EtiquetaConfiguracion | null>(null);

  protected readonly cambios =
    signal(false);

  // ==========================================
  // PERMISOS
  // ==========================================

  protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([
      AUTH_ROLES.ADMINISTRADOR,
      AUTH_ROLES.ADMIN_EMPRESA,
    ])
  );

  // ==========================================
  // FORMULARIO
  // ==========================================

  protected readonly form = this.fb.nonNullable.group({

    // General
    activo: [true],
    permitirTicketPublico: [false],

    // Información básica
    mostrarNombreActivo: [true],
    mostrarCodigoActivo: [false],
    mostrarNumeroInventario: [false],
    mostrarNumeroSerie: [false],

    // Clasificación
    mostrarCategoria: [false],
    mostrarMarcaModelo: [false],

    // Ubicación
    mostrarSucursal: [false],
    mostrarUbicacion: [false],

    // Otros
    mostrarResponsable: [false],
    mostrarEstadoActivo: [false],

    // Empresa
    mostrarDatosEmpresa: [false],

  });

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor() {

    // Detectar modificaciones del formulario.
    this.form.valueChanges.subscribe(() => {
      this.actualizarCambios();
    });

    // Recargar cuando cambia la empresa.
    effect(onCleanup => {

      const empresaId =
        this.empresa.seleccionada()?.id ?? null;

      const requestId = ++this.solicitud;

      this.configuracion.set(null);
      this.configuracionOriginal = null;

      this.error.set(null);
      this.exito.set(null);
      this.cambios.set(false);
      this.cargando.set(!!empresaId);

      this.form.disable({
        emitEvent: false,
      });

      if (!empresaId) {
        return;
      }

      const sub = this.service.get().subscribe({

        next: datos => {

          if (
            requestId !== this.solicitud ||
            this.empresa.empresaId !== empresaId
          ) {
            return;
          }

          this.asignarConfiguracion(datos);

          this.cargando.set(false);
        },

        error: err => {

          if (
            requestId !== this.solicitud ||
            this.empresa.empresaId !== empresaId
          ) {
            return;
          }

          this.error.set(
            mensajeApi(
              err,
              'No fue posible cargar la configuración de etiquetas.'
            )
          );

          this.cargando.set(false);
        },

      });

      onCleanup(() => sub.unsubscribe());

    });
  }

  // ==========================================
  // ASIGNAR CONFIGURACION
  // ==========================================

  private asignarConfiguracion(
    datos: EtiquetaConfiguracion
  ): void {

    this.configuracion.set(datos);

    const valores: EtiquetaConfiguracionGuardar = {

      activo: datos.activo,
      permitirTicketPublico: datos.permitirTicketPublico,

      mostrarNombreActivo: datos.mostrarNombreActivo,
      mostrarCodigoActivo: datos.mostrarCodigoActivo,

      mostrarNumeroInventario: datos.mostrarNumeroInventario,
      mostrarNumeroSerie: datos.mostrarNumeroSerie,

      mostrarCategoria: datos.mostrarCategoria,
      mostrarMarcaModelo: datos.mostrarMarcaModelo,

      mostrarSucursal: datos.mostrarSucursal,
      mostrarUbicacion: datos.mostrarUbicacion,

      mostrarResponsable: datos.mostrarResponsable,
      mostrarEstadoActivo: datos.mostrarEstadoActivo,

      mostrarDatosEmpresa: datos.mostrarDatosEmpresa,
    };

    this.configuracionOriginal = { ...valores };

    this.form.reset(valores, {
      emitEvent: false,
    });

    if (this.puedeGestionar()) {

      this.form.enable({
        emitEvent: false,
      });

    } else {

      this.form.disable({
        emitEvent: false,
      });
    }

    this.cambios.set(false);
  }

  // ==========================================
  // DETECTAR CAMBIOS
  // ==========================================

  private actualizarCambios(): void {

    if (!this.configuracionOriginal) {

      this.cambios.set(false);

      return;
    }

    const actual = this.form.getRawValue();

    const original = this.configuracionOriginal;

    const hayCambios =
      Object.keys(original).some(clave => {

        const propiedad =
          clave as keyof EtiquetaConfiguracionGuardar;

        return actual[propiedad] !== original[propiedad];

      });

    this.cambios.set(hayCambios);
  }

  // ==========================================
  // RESTABLECER CAMBIOS
  // ==========================================

  protected restablecer(): void {

    if (
      !this.configuracionOriginal ||
      this.guardando() ||
      !this.puedeGestionar()
    ) {
      return;
    }

    this.form.reset(
      this.configuracionOriginal,
      { emitEvent: false }
    );

    this.cambios.set(false);

    this.error.set(null);
    this.exito.set(null);
  }

  // ==========================================
  // GUARDAR
  // ==========================================

  protected async guardar(): Promise<void> {

    if (
      !this.puedeGestionar() ||
      !this.empresa.empresaId ||
      !this.configuracion() ||
      this.guardando() ||
      this.cargando() ||
      !this.cambios()
    ) {
      return;
    }

    const empresaId = this.empresa.empresaId;

    const dto: EtiquetaConfiguracionGuardar =
      this.form.getRawValue();

    this.guardando.set(true);

    this.error.set(null);
    this.exito.set(null);

    this.form.disable({
      emitEvent: false,
    });

    try {

      const resultado = await firstValueFrom(
        this.service.guardar(dto)
      );

      // Evitar aplicar cambios si el usuario
      // seleccionó otra empresa.
      if (empresaId !== this.empresa.empresaId) {
        return;
      }

      this.asignarConfiguracion(resultado);

      this.exito.set(
        'Configuración de etiquetas guardada correctamente.'
      );

    } catch (err) {

      if (empresaId !== this.empresa.empresaId) {
        return;
      }

      this.error.set(
        mensajeApi(
          err,
          'No fue posible guardar la configuración.'
        )
      );

    } finally {

      this.guardando.set(false);

      if (
        empresaId === this.empresa.empresaId &&
        this.puedeGestionar() &&
        this.configuracion()
      ) {

        this.form.enable({
          emitEvent: false,
        });
      }
    }
  }

  // ==========================================
  // NAVEGACION
  // ==========================================

  protected volver(): void {

    void this.router.navigate([
      '/admin/etiquetas',
    ]);
  }
}