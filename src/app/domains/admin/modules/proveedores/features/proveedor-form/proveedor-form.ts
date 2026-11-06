import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { EmpresaContextoService } from '@/app/core/empresa-contexto.service';
import { AUTH_ROLES } from '@/app/domains/auth/constants/auth.roles';
import { AuthService } from '@/app/domains/auth/services/auth.services';
import { ProveedorContactos } from '../proveedor-contactos/proveedor-contactos';
import { ProveedoresService } from '../../services/proveedores.service';
import { TiposProveedorService } from '../../services/tipos-proveedor.service';
import { ProveedorGuardar, TipoProveedor } from '../../types/proveedor.types';

@Component({
  selector: 'app-proveedor-form',
  templateUrl: './proveedor-form.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ProveedorContactos,
  ],
})
export default class ProveedorForm {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ProveedoresService);
  private readonly tiposService = inject(TiposProveedorService);
  private readonly auth = inject(AuthService);
  protected readonly empresaContexto = inject(EmpresaContextoService);

  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly esEdicion = !!this.id;
  protected readonly puedeGestionar = computed(() =>
    this.auth.hasAnyRole([AUTH_ROLES.ADMINISTRADOR, AUTH_ROLES.ADMIN_EMPRESA])
  );
  protected readonly loading = signal(false);
  protected readonly guardando = signal(false);
  protected readonly detalleCargado = signal(false);
  protected readonly proveedorActivo = signal(true);
  protected readonly tipos = signal<TipoProveedor[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly advertenciaTipos = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    clave: ['', [Validators.required, Validators.maxLength(50)]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    razonSocial: ['', Validators.maxLength(250)],
    rfc: ['', Validators.maxLength(13)],
    correo: ['', [Validators.email, Validators.maxLength(256)]],
    telefono: ['', Validators.maxLength(30)],
    sitioWeb: ['', Validators.maxLength(300)],
    direccion: ['', Validators.maxLength(300)],
    colonia: ['', Validators.maxLength(150)],
    municipio: ['', Validators.maxLength(150)],
    estado: ['', Validators.maxLength(150)],
    pais: ['', Validators.maxLength(100)],
    codigoPostal: ['', Validators.maxLength(15)],
    observaciones: ['', Validators.maxLength(1000)],
    tipoProveedorIds: this.fb.nonNullable.control<number[]>([], Validators.required),
  });

  constructor() {
    effect(onCleanup => {
      const empresaId = this.empresaContexto.seleccionada()?.id ?? null;
      this.form.reset();
      this.form.enable({ emitEvent: false });
      this.proveedorActivo.set(true);
      this.tipos.set([]);
      this.errorMessage.set(null);
      this.successMessage.set(null);
      this.advertenciaTipos.set(null);
      this.detalleCargado.set(false);
      this.loading.set(!!empresaId);
      if (!empresaId) return;

      const sub = forkJoin({
        tipos: this.tiposService.getAll(),
        detalle: this.id ? this.service.getById(this.id) : of(null),
      }).subscribe({
        next: datos => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.tipos.set(datos.tipos);
          if (datos.detalle) {
            const d = datos.detalle;
            this.proveedorActivo.set(d.activo);
            const tiposActivos = new Set(datos.tipos.map(t => t.id));
            const idsValidos = d.tipoProveedorIds.filter(tipo => tiposActivos.has(tipo));
            if (idsValidos.length !== d.tipoProveedorIds.length) {
              this.advertenciaTipos.set(
                'El proveedor tenía tipos de servicio que ya no están activos. Se excluyeron de la selección; revisa los tipos antes de guardar.'
              );
            }
            this.form.patchValue({
              clave: d.clave,
              nombre: d.nombre,
              razonSocial: d.razonSocial ?? '',
              rfc: d.rfc ?? '',
              correo: d.correo ?? '',
              telefono: d.telefono ?? '',
              sitioWeb: d.sitioWeb ?? '',
              direccion: d.direccion ?? '',
              colonia: d.colonia ?? '',
              municipio: d.municipio ?? '',
              estado: d.estado ?? '',
              pais: d.pais ?? '',
              codigoPostal: d.codigoPostal ?? '',
              observaciones: d.observaciones ?? '',
              tipoProveedorIds: idsValidos,
            });
          }
          if (!this.puedeGestionar()) this.form.disable({ emitEvent: false });
          this.detalleCargado.set(true);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (this.empresaContexto.empresaId !== empresaId) return;
          this.errorMessage.set(this.mensajeError(error, 'No fue posible cargar los datos del proveedor.'));
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected async guardar(): Promise<void> {
    if (this.guardando() || !this.detalleCargado() || !this.puedeGestionar()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const empresaId = this.empresaContexto.empresaId;
    if (!empresaId) {
      this.errorMessage.set('Debes seleccionar una empresa.');
      return;
    }

    const f = this.form.getRawValue();
    if (!f.clave.trim() || !f.nombre.trim()) {
      this.errorMessage.set('La clave y el nombre son obligatorios.');
      return;
    }
    const ids = [...new Set(f.tipoProveedorIds)];
    if (ids.length === 0 || ids.some(id => !this.tipos().some(t => t.id === id))) {
      this.errorMessage.set('Selecciona al menos un tipo de proveedor válido.');
      return;
    }

    const dto: ProveedorGuardar = {
      clave: f.clave.trim().toUpperCase(),
      nombre: f.nombre.trim(),
      razonSocial: this.nullIfEmpty(f.razonSocial),
      rfc: this.nullIfEmpty(f.rfc)?.toUpperCase() ?? null,
      correo: this.nullIfEmpty(f.correo),
      telefono: this.nullIfEmpty(f.telefono),
      sitioWeb: this.nullIfEmpty(f.sitioWeb),
      direccion: this.nullIfEmpty(f.direccion),
      colonia: this.nullIfEmpty(f.colonia),
      municipio: this.nullIfEmpty(f.municipio),
      estado: this.nullIfEmpty(f.estado),
      pais: this.nullIfEmpty(f.pais),
      codigoPostal: this.nullIfEmpty(f.codigoPostal),
      observaciones: this.nullIfEmpty(f.observaciones),
      tipoProveedorIds: ids,
    };

    this.guardando.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      if (this.id) {
        await firstValueFrom(this.service.update(this.id, dto));
        if (this.empresaContexto.empresaId === empresaId) {
          this.advertenciaTipos.set(null);
          this.successMessage.set('Datos del proveedor guardados correctamente.');
          this.form.markAsPristine();
        }
      } else {
        const creado = await firstValueFrom(this.service.create(dto));
        if (this.empresaContexto.empresaId === empresaId) {
          // Después de registrar al proveedor, habilitamos la administración de contactos.
          await this.router.navigate(['/admin/proveedores', creado.id]);
        }
      }
    } catch (error) {
      if (this.empresaContexto.empresaId === empresaId) {
        this.errorMessage.set(this.mensajeError(error, 'No fue posible guardar el proveedor.'));
      }
    } finally {
      this.guardando.set(false);
    }
  }

  protected volver(): void {
    void this.router.navigate(['/admin/proveedores']);
  }

  private nullIfEmpty(valor: string): string | null {
    return valor.trim() || null;
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return fallback;
  }
}
